from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from online_monitor import views

urlpatterns = [

    url(r'^get_hist_1d', views.get_hist_1d, name='get_hist_1d'),
    url(r'^get_run_list', views.get_run_list, name='get_run_list'),
    url(r'^get_event_rates', views.get_event_rates, name='get_event_rates'),
    url(r'^get_event_rate_history', views.get_event_rate_history, name='get_event_rate_history'),
    url(r'^get_series_2d', views.get_series_2d, name='get_series_2d'),
    url(r'^get_rdt', views.get_rdt, name='get_rdt'),
    url(r'^get_elife_history', views.get_elife_history, name='get_elife_history'),
    url(r'$', login_required(TemplateView.as_view(template_name="online_monitor/online_monitor.html"))),
    #url(r'^get_status_update',views.GetStatusUpdate,name='get_status_update'),
    #   url(r'^rundetail',views.rundetail,name='rundetail'),
    #    url(r'^download_list',views.download_list,name='download_list'),
    #url(r'$', login_required( views.runs ), name='runs' ),
]
