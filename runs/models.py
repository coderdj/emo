from django.db import models
from django import forms

class run_comment(forms.Form):
    text = forms.CharField(max_length=5000)
