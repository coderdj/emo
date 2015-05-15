from django.db import models
from django import forms
import datetime
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField( User )
    control_permission_date = models.DateTimeField(null = True, default = datetime.datetime.min )


class UserRequest(forms.Form):
    auth = forms.CharField(max_length=10)
