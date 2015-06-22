from django.db import models
from django import forms


class RunStartForm(forms.Form):

    user = forms.CharField(label="User", max_length=100, required=False)

