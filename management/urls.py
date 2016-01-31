from django.conf.urls import url
from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required
from management import views

urlpatterns = [

    url(r'^update_user', views.update_user, name='update_user'),
    url(r'^get_user_list', views.get_user_list, name='get_user_list'),
    url(r'^shift_management', views.shift_management, name='shift_management'),
    url(r'$', login_required(views.get_user_list), name="user_management")
]
