from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from runs import views
urlpatterns = [
    
    url(r'$', login_required( TemplateView.as_view( template_name=
                                                    "control/controlPanel.html"))),

    #   url(r'^rundetail',views.rundetail,name='rundetail'),
    #    url(r'^download_list',views.download_list,name='download_list'),
    #url(r'$', login_required( views.runs ), name='runs' ),
]
