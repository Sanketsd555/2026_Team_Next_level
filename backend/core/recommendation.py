from .assistant import _ollama, CHAT_MODEL
from .mongomodels import LoanApplication


def recommend_for(username):
    applications = list(LoanApplication.objects(applicant_username=username).order_by("-created_at"))
    active = [app for app in applications if app.status in ("pending", "approved")]
    total_exposure = sum(app.amount for app in active)
    active_count = len(active)

    existing = [
        {
            "purpose": app.purpose or "Loan",
            "bank": app.bank_organization,
            "amount": app.amount,
            "status": app.status,
        }
        for app in active
    ]

    if active_count >= 3 or total_exposure >= 900000:
        recommendation = {
            "overburdened": True,
            "reject": True,
            "recommended_max_amount": 0,
            "suggested_tenure_months": 0,
            "reason": (
                f"You already have {active_count} active loan(s) with a total exposure of "
                f"₹{total_exposure:,.0f}. Taking on another loan right now is not recommended."
            ),
        }
    elif active_count >= 2 or total_exposure >= 400000:
        recommendation = {
            "overburdened": True,
            "reject": False,
            "recommended_max_amount": 200000,
            "suggested_tenure_months": 36,
            "reason": (
                f"You have {active_count} active loan(s) with a total exposure of ₹{total_exposure:,.0f}. "
                "To keep your repayments manageable, go for a smaller amount and a longer tenure, "
                "or consider not applying right now."
            ),
        }
    else:
        recommendation = {
            "overburdened": False,
            "reject": False,
            "recommended_max_amount": 500000,
            "suggested_tenure_months": 24,
            "reason": (
                f"Your profile looks healthy ({active_count} active loan(s), "
                f"₹{total_exposure:,.0f} exposure). You can apply for up to ₹5,00,000."
            ),
        }

    recommendation["existing_loans"] = existing
    recommendation["active_count"] = active_count
    recommendation["total_exposure"] = total_exposure

    try:
        commitments = "\n".join(
            f"- {item['purpose']} of Rs {item['amount']:,.0f} with {item['bank']} ({item['status']})"
            for item in existing
        ) or "- none"
        prompt = (
            "You are a loan risk advisor at LoanFlow. The user has these existing loan commitments:\n"
            f"{commitments}\n\n"
            f"The AI has already decided: overburdened={recommendation['overburdened']}, "
            f"reject={recommendation['reject']}, recommended max amount="
            f"Rs {recommendation['recommended_max_amount']:,.0f}, suggested tenure="
            f"{recommendation['suggested_tenure_months']} months.\n\n"
            f"Write a short, friendly explanation of this advice for the user, mentioning the "
            f"recommended maximum loan amount explicitly like 'Recommended maximum loan amount: "
            f"₹{recommendation['recommended_max_amount']:,.0f}'."
        )
        ai_reason = _ollama(
            "/api/generate",
            {
                "model": CHAT_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 200},
            },
        ).get("response", "").strip()
        if ai_reason:
            recommendation["reason"] = ai_reason
    except Exception:
        pass

    return recommendation
