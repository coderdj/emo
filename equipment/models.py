from django.db import models
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit, HTML, Button, Row, Field
from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
from datetime import datetime
forms.DateInput.input_type="date"

class NewEquipmentForm(forms.Form):
    model = forms.CharField(max_length=200, label="Model Number")
    type = forms.CharField(max_length=200, label="Equipment Type", required=False)
    manufacturer = forms.CharField(max_length=200, label="Manufacturer", required=False)
    serial = forms.CharField(max_length=200, label="Serial Number")    
    purchased = forms.DateField(label="Purchase Date", required=False)
    purchaser = forms.CharField(max_length=200, label="Purchased By", required=False)
    experiment = forms.CharField(max_length=200, label="Experiment", required=False)
    os = forms.CharField(max_length=200, label="OS/Firmware", required=False)
    comment = forms.CharField(max_length=1000, label="Description", required=False)

    OPTIONS = (
            ("Installed", "Installed"),
            ("Spare", "Spare"),
            ("Storage", "Storage"),
            ("Loan", "Loan"),
            ("Repair", "Repair"),
            ("Broken", "Broken"),
            ("Other", "Other"),
            ("Unknown", "Unknown"),
    )
    status = forms.ChoiceField(label="Status", choices=OPTIONS)
    helper = FormHelper()
    helper.form_class = 'form-horizontal'
    helper.label_class = 'col-lg-2'
    helper.field_class = 'col-lg-8'

class NewActionForm(forms.Form):
    model = forms.CharField(max_length=200)
    manuacturer = forms.CharField(max_length=200, required=False)
    serial = forms.CharField(max_length=200, required=False)
    
    action_type = forms.CharField(max_length=500)
    location = forms.CharField(max_length=200)
    comment = forms.CharField(max_length=1000)
    uploadfile = forms.FileField(required=False)
    uploadfile_2 = forms.FileField(required=False)
    uploadfile_3 = forms.FileField(required=False)
    
'''
    helper.layout = Layout(
        Field('model', css_class='input-xlarge'),
        Field('textarea', rows="3", css_class='input-xlarge'),
        'radio_buttons',
        Field('checkboxes', style="background: #FAFAFA; padding: 10px;"),
        AppendedText('appended_text', '.00'),
        PrependedText('prepended_text', '<input type="checkbox" checked="checked" value="" id="" name="">', active=True),
        PrependedText('prepended_text_two', '@'),
        'multicolon_select',
        FormActions(
            Submit('save_changes', 'Save changes', css_class="btn-primary"),
            Submit('cancel', 'Cancel'),
        )
    )
'''
