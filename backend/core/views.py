from datetime import datetime

from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .blockchain import (
    BlockchainConfigError,
    build_borrower_hash,
    build_document_cipher,
    build_loan_hash,
    get_blockchain_client,
    verification_verdict,
)
from .models import User
from .assistant import answer_question
from .mongomodels import LoanAdvertisement, LoanApplication
from .recommendation import recommend_for
from .serializers import LoanAdvertisementSerializer, LoanApplicationSerializer, RegisterSerializer, UserSerializer
from .verification import verify_document

NBFC_BANKS = [
    ("bajaj_finance", "Bajaj Finance Limited"),
    ("tata_capital", "Tata Capital"),
    ("shriram_finance", "Shriram Finance"),
]


def seed_advertisements():
    nbfc_names = [organization for _, organization in NBFC_BANKS]
    LoanAdvertisement.objects(bank_name__nin=nbfc_names).delete()
    if LoanAdvertisement.objects(bank_name__in=nbfc_names).count():
        return
    LoanAdvertisement.objects.insert(
        [
            LoanAdvertisement(
                title="Quick Personal Loan",
                bank_name="Bajaj Finance Limited",
                description="Fast approval for everyday expenses with flexible repayment options.",
                apr=9.50,
                min_amount=10000,
                max_amount=250000,
            ),
            LoanAdvertisement(
                title="Home Loan Plus",
                bank_name="Bajaj Finance Limited",
                description="Affordable financing for your dream home with easy EMI options.",
                apr=8.75,
                min_amount=100000,
                max_amount=1000000,
            ),
            LoanAdvertisement(
                title="Two-Wheeler Loan",
                bank_name="Tata Capital",
                description="Drive home your new two-wheeler with low interest and quick approval.",
                apr=10.99,
                min_amount=20000,
                max_amount=200000,
            ),
            LoanAdvertisement(
                title="Business Loan",
                bank_name="Tata Capital",
                description="Grow your business with working capital financing and flexible tenures.",
                apr=11.25,
                min_amount=50000,
                max_amount=500000,
            ),
            LoanAdvertisement(
                title="Personal Loan",
                bank_name="Shriram Finance",
                description="Flexible personal loans for salaried and self-employed customers.",
                apr=11.50,
                min_amount=15000,
                max_amount=300000,
            ),
            LoanAdvertisement(
                title="Gold Loan",
                bank_name="Shriram Finance",
                description="Unlock the value of your gold with instant loan disbursal.",
                apr=9.99,
                min_amount=10000,
                max_amount=500000,
            ),
        ]
    )


def seed_banks():
    known_names = {username for username, _ in NBFC_BANKS}
    previous_names = (
        "bajaj_finance",
        "tata_capital",
        "shriram_finance",
        "mahindra_finance",
        "lt_finance",
        "fullerton_india",
    )
    User.objects.filter(role=User.Role.BANK, username__in=previous_names).exclude(username__in=known_names).delete()
    for username, organization in NBFC_BANKS:
        if User.objects.filter(username=username).exists():
            continue
        user = User(
            username=username,
            role=User.Role.BANK,
            organization=organization,
            plain_password="nbfc@2026",
        )
        user.set_password("nbfc@2026")
        user.save()
        Token.objects.get_or_create(user=user)


def seed_admin():
    user = User.objects.filter(username="admin").first()
    if not user:
        user = User(username="admin", email="admin@loanflow.app", role=User.Role.ADMIN)
    user.role = User.Role.ADMIN
    user.is_staff = True
    user.is_superuser = True
    user.set_password("admin@2026")
    user.save()
    Token.objects.get_or_create(user=user)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.data.get("role") != User.Role.USER:
            return Response(
                {"detail": "Only user accounts can be created. Banks and admins are managed by the system."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.get(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        seed_banks()
        seed_admin()
        username = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")
        user = User.objects.filter(username=username).first()
        if not user or not user.check_password(password) or user.role != role:
            return Response({"detail": "Invalid credentials for the selected role."}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class DemoBanksView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        seed_banks()
        banks = User.objects.filter(role=User.Role.BANK).order_by("username")
        return Response(
            [
                {
                    "username": bank.username,
                    "organization": bank.organization,
                    "password": bank.plain_password or "nbfc@2026",
                }
                for bank in banks
            ]
        )


class HealthMetricsView(APIView):
    def get(self, request):
        if request.user.role not in {User.Role.BANK, User.Role.ADMIN}:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        from .telemetry import collect_health_metrics

        return Response(collect_health_metrics())


class AdminAnalyticsView(APIView):
    def get(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        from .telemetry import collect_health_metrics

        health = collect_health_metrics()
        base_latency = 0.0
        for metric in health["metrics"]:
            if metric["key"] in {"hash", "mongo_read"} and metric["value_ms"] is not None:
                base_latency += metric["value_ms"]

        apps = list(LoanApplication.objects.order_by("-created_at")[:12])
        series = []
        correct = 0
        for index, app in enumerate(reversed(apps), start=1):
            predicted = "rejected" if app.auto_rejected else "approved"
            actual = app.status
            correct += 1 if predicted == actual else 0
            series.append(
                {
                    "id": str(app.id)[-6:],
                    "label": (app.purpose or "loan")[:18],
                    "latency_ms": round(app.analysis_ms or base_latency, 2),
                    "cumulative_accuracy": round(correct * 100 / index, 1),
                    "status": actual,
                }
            )
        return Response(
            {
                "summary": {
                    "avg_latency_ms": round(sum(point["latency_ms"] for point in series) / len(series), 2) if series else 0,
                    "overall_accuracy": round(correct * 100 / len(series), 1) if series else 0,
                    "samples": len(series),
                },
                "series": series,
                "health": health,
                "generated_at": datetime.utcnow().isoformat() + "Z",
            }
        )


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class BankListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seed_banks()
        banks = User.objects.filter(role=User.Role.BANK).order_by("username")
        return Response(UserSerializer(banks, many=True).data)


class LoanAdvertisementListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        seed_advertisements()
        registered = [organization for _, organization in NBFC_BANKS]
        ads = LoanAdvertisement.objects(is_active=True, bank_name__in=registered).order_by("-created_at")
        return Response(LoanAdvertisementSerializer(ads, many=True).data)


class LoanApplicationListCreateView(APIView):
    def get(self, request):
        if request.user.role == User.Role.USER:
            applications = LoanApplication.objects(applicant_username=request.user.username).order_by("-created_at")
        elif request.user.role == User.Role.BANK:
            applications = LoanApplication.objects(bank_username=request.user.username).order_by("-created_at")
        else:
            applications = LoanApplication.objects.order_by("-created_at")
        return Response(LoanApplicationSerializer(applications, many=True).data)

    def post(self, request):
        if request.user.role != User.Role.USER:
            return Response({"detail": "Only users can submit loan applications."}, status=status.HTTP_403_FORBIDDEN)
        bank_id = request.data.get("bank_id")
        bank = User.objects.filter(pk=bank_id, role=User.Role.BANK).first()
        if not bank:
            return Response({"detail": "Invalid bank."}, status=status.HTTP_400_BAD_REQUEST)
        aadhar_number = request.data.get("aadhar_number", "")
        pan_number = request.data.get("pan_number", "")
        try:
            borrower_hash = build_borrower_hash(aadhar_number)
            document_cipher = build_document_cipher(pan_number, aadhar_number)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        application = LoanApplication(
            applicant_username=request.user.username,
            applicant_email=request.user.email,
            bank_username=bank.username,
            bank_organization=bank.organization,
            bank_user_id=str(bank.id),
            full_name=request.data.get("full_name", ""),
            email=request.data.get("email", ""),
            mobile_number=request.data.get("mobile_number", ""),
            pan_number="",
            aadhar_number="",
            pan_enc=document_cipher["pan_enc"],
            aadhar_enc=document_cipher["aadhar_enc"],
            borrower_hash=borrower_hash,
            bank_account_number=request.data.get("bank_account_number", ""),
            ifsc_code=request.data.get("ifsc_code", ""),
            amount=int(request.data.get("amount") or 0),
            purpose=request.data.get("purpose", ""),
            tenure_months=int(request.data.get("tenure_months") or 12),
        )
        application.save()
        application.loan_hash = build_loan_hash(application.id)
        application.save()
        from .analyser import analyse_application
        analyse_application(application, persist=True)
        application.reload()
        return Response(LoanApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class BorrowerRiskCheckView(APIView):
    def get(self, request):
        if request.user.role != User.Role.USER:
            return Response({"detail": "Only users can check borrower history."}, status=status.HTTP_403_FORBIDDEN)

        aadhar_number = request.query_params.get("aadhar_number", "")
        try:
            borrower_hash = build_borrower_hash(aadhar_number)
            blockchain = get_blockchain_client()
            loan_hashes = blockchain.get_borrower_loans(borrower_hash)
            loan_count = blockchain.get_loan_count(borrower_hash)
            high_risk = blockchain.is_high_risk(borrower_hash)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        except (BlockchainConfigError, RuntimeError) as error:
            return Response({"detail": str(error)}, status=status.HTTP_502_BAD_GATEWAY)

        local_matches = LoanApplication.objects(borrower_hash=borrower_hash).order_by("-created_at")
        local_entries = [
            {
                "id": str(application.id),
                "status": application.status,
                "purpose": application.purpose,
                "loan_hash": application.loan_hash,
                "blockchain_tx_hash": application.blockchain_tx_hash,
            }
            for application in local_matches
        ]
        return Response(
            {
                "borrower_hash": borrower_hash,
                "loan_hashes": loan_hashes,
                "loan_count": loan_count,
                "is_high_risk": high_risk,
                "local_matches": local_entries,
            }
        )


class LoanApplicationDetailView(APIView):
    def patch(self, request, pk):
        application = LoanApplication.objects(pk=str(pk)).first()
        if not application:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in {User.Role.BANK, User.Role.ADMIN}:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == User.Role.BANK and application.bank_username != request.user.username:
            return Response({"detail": "You can only update your own bank applications."}, status=status.HTTP_403_FORBIDDEN)
        status_value = request.data.get("status")
        if status_value not in {"pending", "approved", "rejected"}:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        if status_value == "approved" and application.auto_rejected:
            return Response(
                {"detail": "Auto-rejected by the AI analyser: this borrower already holds a loan from another bank."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not application.borrower_hash:
            try:
                application.borrower_hash = build_borrower_hash(application.aadhar_number)
            except ValueError as error:
                return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        if not application.loan_hash:
            application.loan_hash = build_loan_hash(application.id)

        if status_value == "approved" and not application.blockchain_tx_hash:
            import time as timer

            chain_start = timer.perf_counter()
            try:
                blockchain = get_blockchain_client()
                existing_loan_count = blockchain.get_loan_count(application.borrower_hash)
                risk_score = min(existing_loan_count * 20, 100)
                fraud_status = 1 if risk_score >= 60 else 0
                ai_reason = f"Borrower has {existing_loan_count} existing blockchain loan(s)."
                tx_result = blockchain.register_loan(
                    borrower_hash=application.borrower_hash,
                    loan_hash=application.loan_hash,
                    lender_id=application.bank_username,
                    amount=application.amount,
                    risk_score=risk_score,
                    fraud_status=fraud_status,
                    ai_reason=ai_reason,
                )
                application.blockchain_tx_hash = tx_result["tx_hash"]
                application.blockchain_network = tx_result["network"]
            except (BlockchainConfigError, RuntimeError) as error:
                application.ai_reason = (
                    f"{application.ai_reason or ''}\n[Blockchain ledger offline — approval recorded locally: {error}]"
                ).strip()
            application.chain_write_ms = round((timer.perf_counter() - chain_start) * 1000, 2)

        application.status = status_value
        application.updated_at = datetime.utcnow()
        application.save()
        return Response(LoanApplicationSerializer(application).data)

    def delete(self, request, pk):
        application = LoanApplication.objects(pk=str(pk)).first()
        if not application:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in {User.Role.BANK, User.Role.ADMIN}:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == User.Role.BANK and application.bank_username != request.user.username:
            return Response({"detail": "You can only delete your own bank applications."}, status=status.HTTP_403_FORBIDDEN)
        application.delete()
        return Response({"detail": f"Application {pk} deleted."})

    def post(self, request, pk):
        application = LoanApplication.objects(pk=str(pk)).first()
        if not application:
            return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role not in {User.Role.BANK, User.Role.ADMIN}:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == User.Role.BANK and application.bank_username != request.user.username:
            return Response({"detail": "You can only verify your own bank applications."}, status=status.HTTP_403_FORBIDDEN)

        if str(request.path).endswith("/analyse/"):
            from .analyser import analyse_application

            result = analyse_application(application, persist=True)
            application.reload()
            return Response(
                {
                    "analysis": result,
                    "application": LoanApplicationSerializer(application).data,
                    "message": (
                        "AI analyser complete. Multi-bank lending, fraud signals and risk score were "
                        "computed without exposing any raw personal data."
                    ),
                }
            )

        cipher = application.aadhar_enc or application.borrower_hash
        verdict = verification_verdict(cipher)
        return Response(
            {
                "verification": verdict,
                "protocol": "FIPS-180-4 SHA-256 federal cipher",
                "pan_cipher": (application.pan_enc or "")[:16] + "…",
                "aadhar_cipher": (application.aadhar_enc or application.borrower_hash or "")[:16] + "…",
                "message": "Identity verified through the encrypted federal protocol. No raw personal data is disclosed to the bank.",
            }
        )


def bank_application_counts():
    counts = {}
    for row in LoanApplication.objects.aggregate([{"$group": {"_id": "$bank_username", "count": {"$sum": 1}}}]):
        counts[row["_id"]] = row["count"]
    return counts


class AdminSummaryView(APIView):
    def get(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response({"detail": "Admins only."}, status=status.HTTP_403_FORBIDDEN)
        users = list(User.objects.filter(role=User.Role.USER).order_by("username"))
        counts_map = bank_application_counts()
        banks = list(User.objects.filter(role=User.Role.BANK).order_by("username"))
        for bank in banks:
            bank.application_count = counts_map.get(bank.username, 0)
        return Response(
            {
                "users": UserSerializer(users, many=True).data,
                "banks": UserSerializer(banks, many=True).data,
                "counts": {
                    "users": len(users),
                    "banks": len(banks),
                    "applications": LoanApplication.objects.count(),
                },
            }
        )


class AdminBankManageView(APIView):
    def _require_admin(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response({"detail": "Admins only."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get(self, request):
        denied = self._require_admin(request)
        if denied:
            return denied
        counts_map = bank_application_counts()
        banks = list(User.objects.filter(role=User.Role.BANK).order_by("username"))
        for bank in banks:
            bank.application_count = counts_map.get(bank.username, 0)
        return Response(UserSerializer(banks, many=True).data)

    def post(self, request):
        denied = self._require_admin(request)
        if denied:
            return denied
        username = str(request.data.get("username") or "").strip()
        organization = str(request.data.get("organization") or "").strip()
        password = str(request.data.get("password") or "").strip()
        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "A user with this username already exists."}, status=status.HTTP_400_BAD_REQUEST)
        bank = User(username=username, role=User.Role.BANK, organization=organization, plain_password=password)
        bank.set_password(password)
        bank.save()
        Token.objects.get_or_create(user=bank)
        return Response(UserSerializer(bank).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        denied = self._require_admin(request)
        if denied:
            return denied
        bank = User.objects.filter(pk=pk, role=User.Role.BANK).first()
        if not bank:
            return Response({"detail": "Bank not found."}, status=status.HTTP_404_NOT_FOUND)
        organization = request.data.get("organization")
        if organization is not None:
            bank.organization = str(organization).strip()
        password = request.data.get("password")
        if password:
            bank.plain_password = str(password)
            bank.set_password(str(password))
        bank.save()
        return Response(UserSerializer(bank).data)

    def delete(self, request, pk):
        denied = self._require_admin(request)
        if denied:
            return denied
        bank = User.objects.filter(pk=pk, role=User.Role.BANK).first()
        if not bank:
            return Response({"detail": "Bank not found."}, status=status.HTTP_404_NOT_FOUND)
        if LoanApplication.objects(bank_username=bank.username).count():
            return Response(
                {"detail": f"Cannot delete {bank.username}: it has loan applications. Reject or archive them first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        bank.delete()
        return Response({"detail": f"Bank {bank.username} deleted."})


class AssistantChatView(APIView):
    def post(self, request):
        message = str(request.data.get("message") or "").strip()
        if not message:
            return Response({"detail": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(answer_question(message, request.user.username))


class LoanRecommendationView(APIView):
    def get(self, request):
        return Response(recommend_for(request.user.username))


class DocumentVerificationView(APIView):
    def post(self, request):
        upload = request.FILES.get("document")
        if not upload:
            return Response({"detail": "A document image is required."}, status=status.HTTP_400_BAD_REQUEST)
        doc_type = str(request.data.get("document_type") or "pan").lower()
        if doc_type not in {"pan", "aadhaar"}:
            return Response({"detail": "document_type must be 'pan' or 'aadhaar'."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(verify_document(upload, doc_type))