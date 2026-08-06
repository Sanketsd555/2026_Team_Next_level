from django.urls import path

from .views import (
    AdminBankManageView,
    AdminSummaryView,
    BankListView,
    DemoBanksView,
    LoanAdvertisementListView,
    LoanApplicationDetailView,
    LoanApplicationListCreateView,
    LoginView,
    MeView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("demo-banks/", DemoBanksView.as_view()),
    path("banks/", BankListView.as_view()),
    path("loan-ads/", LoanAdvertisementListView.as_view()),
    path("applications/", LoanApplicationListCreateView.as_view()),
    path("applications/<str:pk>/", LoanApplicationDetailView.as_view()),
    path("admin/summary/", AdminSummaryView.as_view()),
    path("admin/banks/", AdminBankManageView.as_view()),
    path("admin/banks/<str:pk>/", AdminBankManageView.as_view()),
]