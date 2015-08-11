from django.db import models
from django import forms


class ScopeRequest(forms.Form):
    module = forms.IntegerField()
    channel= forms.IntegerField()
    bins = forms.IntegerField(required=False)
    collection = forms.CharField(max_length=100)
    next_prev_new = forms.CharField(max_length=100, required=False)
    last_time = forms.IntegerField(required = False)
    #module2 = forms.IntegerField(required=False)
    #channel2=forms.IntegerField(required=False)
