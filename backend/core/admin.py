from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (("Role details", {"fields": ("role", "organization")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (("Role details", {"fields": ("role", "organization")}),)
    list_display = ("username", "email", "role", "organization", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser")