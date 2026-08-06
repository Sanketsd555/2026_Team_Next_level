from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "user", "User"
        BANK = "bank", "Bank"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=16, choices=Role.choices, default=Role.USER)
    organization = models.CharField(max_length=120, blank=True)
    plain_password = models.CharField(max_length=128, blank=True, default="")
