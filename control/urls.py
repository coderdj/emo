from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from control import views

urlpatterns = [
    url(r'^get_status_update',views.GetStatusUpdate,name='get_status_update'),
    url(r'^get_node_updates',views.GetNodeUpdates,name='get_node_updates'),
    url(r'^get_node_history', views.GetNodeHistory,name='get_node_history'),
    url(r'^get_queue_list', views.GetQueueList, name="get_queue_list"),
    url(r'^set_queue_list', views.UpdateQueueList, name="set_queue_list"),
    url(r'^start_run', views.start_run, name='start_run'),
    url(r'^stop_run', views.stop_run, name='stop_run'),
    url(r'^run_start_feedback', views.GetDispatcherReply, name='run_start_feedback'),
    url(r'^fancy', login_required( TemplateView.as_view( template_name=
                                                    "control/controlPanelNew.html"))),
    url(r'^get_tpc_event_rate', views.GetTPCEventRate, name='get_tpc_event_rate'),
    url(r'$', login_required( TemplateView.as_view( template_name=
                                                    "control/controlPanelNew.html"))),

    #url(r'^get_status_update',views.GetStatusUpdate,name='get_status_update'),
    #   url(r'^rundetail',views.rundetail,name='rundetail'),
    #    url(r'^download_list',views.download_list,name='download_list'),
    #url(r'$', login_required( views.runs ), name='runs' ),
]
