from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = [

    url(r'^about', login_required( TemplateView.as_view(
        template_name='docs/about.html'
    ) )),
    url(r'^contact', login_required( TemplateView.as_view(
        template_name='docs/contact.html'
    ) )),
    url(r'$', login_required( TemplateView.as_view( 
        template_name='docs/startpage.html' 
    ) )),

]

