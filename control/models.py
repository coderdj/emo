from django.db import models
from django import forms


class RunStartForm(forms.Form):

    user = forms.CharField(label="User", max_length=100, required=False)
    force = forms.BooleanField()
    comment = forms.CharField(required=False, max_length=5000)
    
    run_mode_tpc = forms.CharField(max_length=200, required=False)
    baselines_tpc = forms.BooleanField(required=False)
    noise_tpc = forms.BooleanField(required=False)

    run_mode_mv = forms.CharField(max_length=200, required=False)
    baselines_mv = forms.BooleanField(required=False)
    noise_mv = forms.BooleanField(required=False)
