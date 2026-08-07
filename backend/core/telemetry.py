import time
import uuid
from datetime import datetime

from .blockchain import build_borrower_hash, build_document_cipher, get_blockchain_client
from .mongomodels import LoanApplication


def _time_ms(operation, iterations=5):
    best = None
    for _ in range(iterations):
        start = time.perf_counter()
        operation()
        elapsed = (time.perf_counter() - start) * 1000
        best = elapsed if best is None else min(best, elapsed)
    return round(best, 3)


def collect_health_metrics():
    metrics = [
        {
            "key": "hash",
            "label": "Hashing (federal SHA-256 cipher)",
            "unit": "ms",
            "value_ms": _time_ms(lambda: build_document_cipher("ABCDE1234F", "123456789012"), 25),
            "online": True,
        },
        {
            "key": "mongo_read",
            "label": "Ledger read (MongoDB)",
            "unit": "ms",
            "value_ms": _time_ms(lambda: LoanApplication.objects.first(), 15),
            "online": True,
        },
    ]

    def probe_write():
        probe = LoanApplication(
            applicant_username="__telemetry__",
            bank_username="__telemetry__",
            full_name="probe",
            email="probe@telemetry.local",
            amount=1,
            purpose=f"telemetry-{uuid.uuid4().hex[:10]}",
        )
        probe.save()
        probe.delete()

    metrics.append(
        {
            "key": "mongo_write",
            "label": "Ledger write (MongoDB)",
            "unit": "ms",
            "value_ms": _time_ms(probe_write, 4),
            "online": True,
        }
    )

    chain_online = False
    chain_read_ms = None
    try:
        client = get_blockchain_client()
        sample_hash = build_borrower_hash("123456789012")
        chain_read_ms = _time_ms(lambda: client.get_loan_count(sample_hash), 3)
        chain_online = True
    except Exception:
        chain_online = False

    metrics.append(
        {
            "key": "chain_read",
            "label": "Blockchain read (loan count lookup)",
            "unit": "ms",
            "value_ms": chain_read_ms,
            "online": chain_online,
        }
    )

    chain_write_ms = None
    chain_write_samples = 0
    try:
        records = list(LoanApplication.objects(chain_write_ms__gt=0).order_by("-created_at")[:10])
        if records:
            chain_write_samples = len(records)
            chain_write_ms = round(sum(record.chain_write_ms for record in records) / len(records), 2)
    except Exception:
        pass

    metrics.append(
        {
            "key": "chain_write",
            "label": "Blockchain write (loan registration avg)",
            "unit": "ms",
            "value_ms": chain_write_ms,
            "online": chain_online,
            "samples": chain_write_samples,
        }
    )

    latest_application = LoanApplication.objects.order_by("-created_at").first()
    latest_analysis = (
        LoanApplication.objects(analysis_at__ne=None).order_by("-analysis_at").first()
    )

    return {
        "healthy": chain_online or all(metric["value_ms"] is not None for metric in metrics),
        "metrics": metrics,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "timestamping": {
            "total_applications": LoanApplication.objects.count(),
            "latest_application_stamp": latest_application.created_at.isoformat() if latest_application else None,
            "latest_analysis_stamp": latest_analysis.analysis_at.isoformat() if latest_analysis else None,
        },
    }
