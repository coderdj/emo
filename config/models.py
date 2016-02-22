from django import forms
from bson.json_util import loads
from pymongo import MongoClient
from django.conf import settings
import logging
# Get an instance of a logger                                                   
logger = logging.getLogger('emo')

# Create your models here.
class ModeSubmissionForm(forms.Form):
    bulk = forms.CharField(max_length=100000, initial='{"your_options": "go_here"}',
                           error_messages = {'badjson': 'Bad JSON formatting. Try running it through a parser.',
                                            'no_name': 'You must include a unique name field in your run mode.',
                                            'no_det': 'You must include a detector field in your run mode.',
                                            'dupe_name': 'Run mode names must be unique!'})
    overwrite = forms.BooleanField(required=False)

    def clean(self):

        cleaned_data = super(ModeSubmissionForm, self).clean()

        try:
            thebson = loads(cleaned_data['bulk'])
        except:
            raise forms.ValidationError(self.fields['bulk'].error_messages['badjson'])
            
        if 'name' not in thebson.keys():
            raise forms.ValidationError(self.fields['bulk'].error_messages['no_name'])
        if 'detector' not in thebson.keys():
            raise forms.ValidationError(self.fields['bulk'].error_messages['no_det'])

        mode_db_collection = "run_modes"
        client = MongoClient(settings.ONLINE_DB_ADDR)
        db = client[settings.ONLINE_DB_NAME]

        collection = db[mode_db_collection]
        logger.error(cleaned_data)
        logger.error(cleaned_data['overwrite'])
        if thebson['name'] in collection.distinct('name') and cleaned_data['overwrite'] == False:
            raise forms.ValidationError(self.fields['bulk'].error_messages['dupe_name'])

        #return self.cleaned_data['bulk']
        return cleaned_data
