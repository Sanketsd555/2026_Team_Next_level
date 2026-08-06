from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.authtoken.models import Token

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
    pan_number = serializers.CharField()
    aadhar_number = serializers.CharField()
    bank_account_number = serializers.CharField()
    ifsc_code = serializers.CharField()
    amount = serializers.IntegerField()
    purpose = serializers.CharField()
    tenure_months = serializers.IntegerField()
    status = serializers.CharField()
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