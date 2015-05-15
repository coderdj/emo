from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = [

    url(r'$', login_required( TemplateView.as_view( template_name='docs/startpage.html' ) )),
]

