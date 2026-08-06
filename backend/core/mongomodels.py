import mongoengine
from datetime import datetime


class LoanAdvertisement(mongoengine.Document):
    meta = {"collection": "loan_advertisements"}

    title = mongoengine.StringField(max_length=120, required=True)
    bank_name = mongoengine.StringField(max_length=120, required=True)
    description = mongoengine.StringField()
    apr = mongoengine.FloatField(default=0.0)
    min_amount = mongoengine.IntField(default=1000)
    max_amount = mongoengine.IntField(default=100000)
    is_active = mongoengine.BooleanField(default=True)
    created_at = mongoengine.DateTimeField(default=datetime.utcnow)


class LoanApplication(mongoengine.Document):
    meta = {"collection": "loan_applications"}

    applicant_username = mongoengine.StringField(required=True)
    applicant_email = mongoengine.StringField(default="")
    bank_username = mongoengine.StringField(required=True)
    bank_organization = mongoengine.StringField(default="")
    bank_user_id = mongoengine.StringField(default="")
    full_name = mongoengine.StringField(max_length=120, required=True)
    email = mongoengine.EmailField(required=True)
    mobile_number = mongoengine.StringField(max_length=15, default="")
    pan_number = mongoengine.StringField(max_length=10, default="")
    aadhar_number = mongoengine.StringField(max_length=12, default="")
    bank_account_number = mongoengine.StringField(max_length=30, default="")
    ifsc_code = mongoengine.StringField(max_length=11, default="")
    borrower_hash = mongoengine.StringField(max_length=128, default="")
    loan_hash = mongoengine.StringField(max_length=128, default="")
    amount = mongoengine.IntField(required=True)
    purpose = mongoengine.StringField(max_length=200, required=True)
    tenure_months = mongoengine.IntField(default=12)
    status = mongoengine.StringField(max_length=16, default="pending")
    blockchain_tx_hash = mongoengine.StringField(max_length=128, default="")
    blockchain_network = mongoengine.StringField(max_length=32, default="")
    created_at = mongoengine.DateTimeField(default=datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.utcnow)
