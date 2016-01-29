from django.db import models
from django import forms
import datetime
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField( User, related_name="profile" )
    control_permission_date = models.DateTimeField(null = True, default = datetime.datetime.min )
    #db_profile_complete = models.BooleanField(default=False)
    def canstartruns(self):
        if (datetime.datetime.now( datetime.timezone.utc ) - self.control_permission_date).days < 7:
            return True
        return False

institutes = (
    ("LNGS", "LNGS"),
    ("Mainz", "Mainz"),
    ("Columbia", "Columbia"),
    ("Rice", "Rice"),
    ("MPIK Heidelberg", "MPIK Heidelberg"),
    ("SUBATECH", "SUBATECH"),
    ("Nantes", "Nantes"),
    ("Bologna", "Bologna"),
    ("UCLA", "UCLA"),
    ("Muenster", "Muenster"),
    ("UC San Diego", "UC San Diego"),
    ("Coimbra", "Coimbra"),
    ("Zurich", "Zurich"),
    ("Nikhef", "Nikhef"),
    ("Weizmann", "Weizmann"),
    ("Purdue", "Purdue"),
    ("Bern", "Bern"), 
    ("RPI", "RPI"),
    ("Stockholm", "Stockholm"),
    ("NYUAD", "NYUAD"),
    ("Chicago", "Chicago"),
    ("Other", "Other"),
)
jobs=(
    ("PI", "PI"),
    ("Staff", "Staff"),
    ("PhD student", "PhD student"),
    ("Postdoc", "Postdoc"),
    ("Master student", "Master student"),
    ("Other student", "Other student"),
    ("Engineer", "Engineer"),
    ("Fluffer", "Fluffer"),
    ("Other", "Other"),
)

class UserInfo(forms.Form):
    last_name = forms.CharField(required=True, label="Family name", max_length=200)
    first_name = forms.CharField(required=True, label="First name(s)", max_length=250)
    institute = forms.ChoiceField(choices=institutes,required=True, label='Affiliation')
    position=forms.ChoiceField(choices=jobs, required=True,label="Position")
    email = forms.CharField(max_length=250, label="Email", required=True)
    skype_id = forms.CharField(max_length=200, label="Skype name", required=False)
    github_id = forms.CharField(max_length=200, label="Github name", required=False)
    cell = forms.CharField(max_length=200, label="Cell number", required=False)
    nickname = forms.CharField(max_length=250, label="Preferred nickname", required=False)
    
class UserRequest(forms.Form):
    auth = forms.CharField(max_length=10)
