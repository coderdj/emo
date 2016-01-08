from django.db import models
from django import forms


class LogCommentForm(forms.Form):
    redirect_url = forms.CharField(max_length=200)
    log_id = forms.CharField(max_length=100)
    content = forms.CharField(max_length=5000, required=False)
    close_issue = forms.BooleanField(required=False)


class LogEntryForm(forms.Form):
    message = forms.CharField(max_length=1000)
    run_name = forms.CharField(max_length=200, initial="none", required=False)
    detector = forms.CharField(max_length=200, initial="none", required=False)
    redirect = forms.CharField(max_length=200, initial="", required=False)

PRIORITY_CHOICES = (    
    (-1, "All"),
    (0, "User Messages"),
    (1, "Info"),
    (2, "Warnings"),
    (3, "Errors"),
    (4, "Fatal"),
    (7, "Closed Warnings"),
    (8, "Closed Errors"),
    (9, "Closed Fatal Errors"),
    (99, "Debug Output"),
    (-2, "Open issues"),
)


class LogSearchForm(forms.Form):
    detector = forms.CharField(label="Detector", max_length=100, required=False)
    run_name = forms.CharField(label="Run Name", max_length=200, required=False)
    start_date = forms.DateField(required=False, label="Start Date", widget=forms.DateInput)
    end_date = forms.DateField(required=False, label="End Date", widget=forms.DateInput)
    priority = forms.ChoiceField(choices=PRIORITY_CHOICES, label="Type filter", widget=forms.Select,
                                 required=False)
    user = forms.CharField(label="User", max_length=100, required=False)
    custom = forms.CharField(label="MongoDB Query", max_length=1000, required=False)
    max_entries = forms.IntegerField(required=False)
