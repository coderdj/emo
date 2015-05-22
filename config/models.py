from django import forms
from bson.json_util import loads
from pymongo import MongoClient

# Create your models here.
class ModeSubmissionForm(forms.Form):
    bulk = forms.CharField(max_length=100000, initial='{\n\n\t"your_options": "go_here"\n\n}',
                           error_messages = {'badjson': 'Bad JSON formatting. Try running it through a parser.',
                                            'no_name': 'You must include a unique name field in your run mode.',
                                            'no_det': 'You must include a detector field in your run mode.',
                                            'dupe_name': 'Run mode names must be unique!'})

    def clean_bulk(self):

       try:
            thebson = loads(self.cleaned_data['bulk'])
       except:
            raise forms.ValidationError(self.fields['bulk'].error_messages['badjson'])

       if 'name' not in thebson.keys():
            raise forms.ValidationError(self.fields['bulk'].error_messages['no_name'])
       if 'detector' not in thebson.keys():
            raise forms.ValidationError(self.fields['bulk'].error_messages['no_det'])

       # These options will be set somewhere else later?
       online_db_name = "online"
       runs_db_collection = "run_modes"
       mongodb_address = "localhost"
       mongodb_port = 27017

       # Connect to pymongo
       client = MongoClient(mongodb_address, mongodb_port)
       db = client[online_db_name]
       collection = db[runs_db_collection]

       if thebson['name'] in collection.distinct('name'):
           raise forms.ValidationError(self.fields['bulk'].error_messages['dupe_name'])

       return self.cleaned_data['bulk']