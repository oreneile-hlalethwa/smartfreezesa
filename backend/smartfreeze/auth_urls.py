from django.urls import path
from . import auth_views

urlpatterns = [
    path('login/',  auth_views.LoginView.as_view(),       name='auth-login'),
    path('logout/', auth_views.LogoutView.as_view(),      name='auth-logout'),
    path('verify/', auth_views.VerifyTokenView.as_view(), name='auth-verify'),
]