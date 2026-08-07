from datetime import datetime
import time

from .assistant import _generate
from .blockchain import get_blockchain_client
from .mongomodels import LoanApplication

MULTI_BANK_FLAG = "multi_bank"


def _chain_loan_count(borrower_hash):
    try:
        client = get_blockchain_client()
        return max(0, int(client.get_loan_count(borrower_hash)))
    except Exception:
        return 0


def _chain_high_risk(borrower_hash):
    try:
        client = get_blockchain_client()
        return bool(client.is_high_risk(borrower_hash))
    except Exception:
        return False


def _other_approved_apps(borrower_hash, exclude_id=None):
    apps = list(
        LoanApplication.objects(borrower_hash=borrower_hash, status="approved").order_by("-created_at")
    )
    if exclude_id:
        apps = [app for app in apps if str(app.id) != str(exclude_id)]
    return apps


def compute_scores(application):
    """Score risk using only the encrypted borrower hash, never raw personal data."""
    borrower_hash = application.borrower_hash or ""
    exclude_id = str(application.id)
    other_apps = _other_approved_apps(borrower_hash, exclude_id)
    local_total = len(other_apps)
    chain_total = _chain_loan_count(borrower_hash) if borrower_hash else 0
    high_risk_chain = _chain_high_risk(borrower_hash) if borrower_hash else False

    existing_loans = local_total + chain_total
    flags = []

    if existing_loans >= 1:
        flags.append(
            {
                "code": MULTI_BANK_FLAG,
                "label": "MULTI-BANK LENDING",
                "detail": f"Applicant already has {existing_loans} approved loan(s) with another lender.",
            }
        )
    if high_risk_chain:
        flags.append(
            {
                "code": "chain_flag",
                "label": "HIGH-RISK CHAIN FLAG",
                "detail": "Borrower cipher is flagged as high risk on the federal ledger.",
            }
        )

    risk_score = min(
        100,
        existing_loans * 35 + (12 if high_risk_chain else 0) + (5 if application.blockchain_tx_hash else 0),
    )
    if risk_score < 20:
        risk_level = "LOW"
    elif risk_score < 45:
        risk_level = "MEDIUM"
    elif risk_score < 70:
        risk_level = "HIGH"
    else:
        risk_level = "VERY HIGH"

    return {
        "existing_loans": existing_loans,
        "local_approved": local_total,
        "chain_loans": chain_total,
        "high_risk_chain": high_risk_chain,
        "risk_score": int(risk_score),
        "risk_level": risk_level,
        "fraud_detected": bool(flags) or risk_score >= 60,
        "fraud_flags": flags,
        "auto_rejected": existing_loans >= 1,
    }


def _generate_ai_reason(application, scores):
    decision_words = "REJECT" if scores["auto_rejected"] else "REVIEW"
    facts = (
        f"Application purpose: {application.purpose}. Amount: Rs {application.amount:,}. "
        f"Tenure: {application.tenure_months} months. Existing approved loans: {scores['existing_loans']}. "
        f"Risk score: {scores['risk_score']}/100. Fraud signals: "
        f"{[flag['label'] for flag in scores['fraud_flags']] or 'none'}."
    )
    prompt = (
        "You are a strict banking risk officer at LoanFlow. The applicant is already holding a loan from "
        "another bank. Banking policy forbids taking a concurrent loan from a different bank; when "
        "MULTI-BANK LENDING is detected the new application must be rejected immediately. Decide strictly. "
        "Use only the facts below (no raw personal data). Answer in 2-3 plain-text sentences ending with "
        f"the recommendation {decision_words}.\n\nFacts: {facts}"
    )
    fallback = (
        f"Borrower ledger shows {scores['existing_loans']} existing loan(s) with another bank. "
        "Policy auto-rejects concurrent multiple-bank borrowings. Fraud detection confirms the "
        f"{scores['risk_level']} risk profile. Recommendation: {decision_words}."
    )
    try:
        reply = _generate(prompt)
        return reply[:900] if reply else fallback
    except Exception:
        return fallback


def analyse_application(application, persist=True):
    scores = compute_scores(application)
    analysis_start = time.perf_counter()
    reason = _generate_ai_reason(application, scores)
    analysis_ms = round((time.perf_counter() - analysis_start) * 1000, 2)

    result = {
        "existing_loans": scores["existing_loans"],
        "risk_score": scores["risk_score"],
        "risk_level": scores["risk_level"],
        "fraud_detected": scores["fraud_detected"],
        "fraud_flags": scores["fraud_flags"],
        "auto_rejected": scores["auto_rejected"],
        "ai_reason": reason,
        "analysis_ms": analysis_ms,
    }
    application.risk_score = scores["risk_score"]
    application.risk_level = scores["risk_level"]
    application.fraud_detected = scores["fraud_detected"]
    application.fraud_flags = scores["fraud_flags"]
    application.ai_reason = reason
    application.auto_rejected = scores["auto_rejected"]
    if scores["auto_rejected"] and application.status in {"pending", "review"}:
        application.status = "rejected"
    application.analysis_at = datetime.utcnow()
    application.analysis_ms = analysis_ms
    if persist:
        application.save()
    return result
