from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .blockchain import verification_verdict
from .models import User


class UserSerializer(serializers.ModelSerializer):
    application_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "organization", "application_count"]


class AuthSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role", "organization"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        if user.role == User.Role.ADMIN:
            user.is_staff = True
        user.save()
        Token.objects.create(user=user)
        return user


class LoginResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = UserSerializer()


class LoanAdvertisementSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    title = serializers.CharField()
    bank_name = serializers.CharField()
    description = serializers.CharField()
    apr = serializers.FloatField()
    min_amount = serializers.IntegerField()
    max_amount = serializers.IntegerField()
    is_active = serializers.BooleanField()

    def get_id(self, obj):
        return str(obj.id)


class LoanApplicationSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    applicant = serializers.SerializerMethodField()
    bank = serializers.SerializerMethodField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    mobile_number = serializers.CharField()
    pan_cipher = serializers.SerializerMethodField()
    aadhar_cipher = serializers.SerializerMethodField()
    verification = serializers.SerializerMethodField()
    bank_account_number = serializers.CharField()
    ifsc_code = serializers.CharField()
    borrower_hash = serializers.CharField(allow_blank=True, required=False)
    loan_hash = serializers.CharField(allow_blank=True, required=False)
    amount = serializers.IntegerField()
    purpose = serializers.CharField()
    tenure_months = serializers.IntegerField()
    status = serializers.CharField()
    risk_score = serializers.IntegerField()
    risk_level = serializers.CharField()
    fraud_detected = serializers.BooleanField()
    fraud_flags = serializers.ListField(child=serializers.DictField(), allow_empty=True)
    ai_reason = serializers.CharField()
    auto_rejected = serializers.BooleanField()
    analysis_at = serializers.SerializerMethodField()
    blockchain_tx_hash = serializers.CharField(allow_blank=True, required=False)
    blockchain_network = serializers.CharField(allow_blank=True, required=False)
    chain_write_ms = serializers.FloatField(required=False)
    created_at = serializers.SerializerMethodField()
    updated_at = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.id)

    def get_applicant(self, obj):
        return {
            "username": obj.applicant_username,
            "email": obj.applicant_email,
            "role": "user",
            "organization": "",
        }

    def get_bank(self, obj):
        return {
            "id": obj.bank_user_id,
            "username": obj.bank_username,
            "organization": obj.bank_organization,
            "role": "bank",
        }

    def get_created_at(self, obj):
        return obj.created_at.isoformat() if obj.created_at else None

    def get_updated_at(self, obj):
        return obj.updated_at.isoformat() if obj.updated_at else None

    def get_pan_cipher(self, obj):
        cipher = obj.pan_enc or (obj.pan_number and "pan:" + str(obj.pan_number)) or ""
        if cipher:
            return f"{cipher[:12]}…{cipher[-6:]}"
        return "CIPHER-PENDING"

    def get_aadhar_cipher(self, obj):
        cipher = obj.aadhar_enc or obj.borrower_hash or (obj.aadhar_number or "")
        if cipher:
            return f"{cipher[:12]}…{cipher[-6:]}"
        return "CIPHER-PENDING"

    def get_verification(self, obj):
        cipher = obj.aadhar_enc or obj.borrower_hash or obj.id
        return verification_verdict(str(cipher))

    def get_analysis_at(self, obj):
        return obj.analysis_at.isoformat() if obj.analysis_at else None