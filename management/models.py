from django.db import models
from django import forms
import datetime
from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

class UserProfile(models.Model):
    user = models.OneToOneField( User, related_name="profile" )
    control_permission_date = models.DateTimeField(null = True, default = datetime.datetime.min )
    last_login = models.DateTimeField(null=True, default=datetime.datetime.min)
    #db_profile_complete = models.BooleanField(default=False)
    def canstartruns(self):
        if (datetime.datetime.now( datetime.timezone.utc ) - self.control_permission_date).days < 7:
            return True
        return False

weekdays = ( ("Monday", "Monday"),
             ("Tuesday", "Tuesday"),
             ("Wednesday", "Wednesday"),
             ("Thursday", "Thursday"),
             ("Friday", "Friday"),
             ("Saturday", "Saturday"),
             ("Sunday", "Sunday") )
years = (( "2016", "2016"),
         ( "2017", "2017"),
         ( "2018", "2018"),
         ( "2019", "2019"),
         ( "2020", "2020"),
         ( "2021", "2021"),
         ( "2022", "2022"),
         ( "2023", "2023"),
         ( "2024", "2024"),
         ( "2025", "2025"),
         ( "2026", "2026"))
shift_types = (("responsible", "responsible"), ("shifter", "shifter"),
               ("training", "training"), ("run coordinator", "run coordinator"), ("credit", "credit"))
class ShiftDefinition(forms.Form):
    year = forms.ChoiceField(choices=years, required=True, label="Year valid", 
                             help_text="Only one rules definition allowed per year")
    shifts_per_week = forms.IntegerField(required=True, label="Shifts per week", 
                                         help_text="Number of people that must be on site each week")
    start_date = forms.DateField(label="Start date", initial=datetime.date.today,
                                 help_text="When the shift definition goes into effect.")   
    collab_def_data = forms.DateField(label="Collaboration count date", 
                                      initial=datetime.date.today, help_text="When the collaboration list is read to determine this period's responsibility")
    auto_assign_weeks = forms.IntegerField(label="Auto assign weeks", help_text="How many weeks ahead the program should auto-assign in case of unclaimed shifts.")
    shift_reset = forms.ChoiceField(choices=weekdays, required=True, 
                                    label="Shift start/end", help_text="The day of the week shifts start/end")    
    auto_assign_start = forms.DateField(label="Auto assignment from", help_text="The date that shift autoassignments start. Can be the same as the start date.")    

class ShiftSignUp(forms.Form):

    class ChoiceFieldNoValidation(forms.ChoiceField):
        def validate(self, value):
            pass

    start_date = forms.DateField(required=True, label="Shift start", 
                                 help_text="First day of shift")
    end_date = forms.DateField(required=True, label="Shift end",
                               help_text="Last day of shift")
    user = ChoiceFieldNoValidation(required=True, label="User", help_text="Username")
    shift_type = ChoiceFieldNoValidation(required=True, help_text="Type of shift")
    institute = ChoiceFieldNoValidation(required=True, label="Affiliation")
    has_car = forms.BooleanField(required=False,label="Do you have a car?", 
                                 help_text="Check if you will have access to a car")
    comment=forms.CharField(required=False, max_length=1000, label="Comment", 
                            help_text="(optional) put here any special things you would like noted")
    remove = forms.BooleanField(required=False, widget=forms.HiddenInput)
class UserInfo(forms.Form):
    username = forms.CharField(required=True, max_length=250)
    last_name = forms.CharField(required=True, label="Family name", max_length=200)
    first_name = forms.CharField(required=True, label="First name(s)", max_length=250)
    institute = forms.ChoiceField(choices=settings.INSTITUTES,required=True, label='Affiliation')
    position=forms.ChoiceField(choices=settings.JOBS, required=True,label="Position")
    email = forms.CharField(max_length=250, label="Email", required=True)
    skype_id = forms.CharField(max_length=200, label="Skype name", required=False)
    github_id = forms.CharField(max_length=200, label="Github name", required=False)
    cell = forms.CharField(max_length=200, label="Cell number", required=False)
    nickname = forms.CharField(max_length=250, label="Preferred nickname", required=False)
    start_date = forms.DateField(label="Start date", required=True, 
                                 help_text="Date that person started in XENON")
    end_date = forms.DateField(label="End date", required=False,
                               help_text="Date that person left XENON (empty if none)")
class UserRequest(forms.Form):
    auth = forms.CharField(max_length=10)
