from django.db import models
from django import forms
import datetime
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField( User, related_name="profile" )
    control_permission_date = models.DateTimeField(null = True, default = datetime.datetime.min )

    def canstartruns(self):
        if (datetime.datetime.now( datetime.timezone.utc ) - self.control_permission_date).days < 7:
            return True
        return False


class UserRequest(forms.Form):
    auth = forms.CharField(max_length=10)
