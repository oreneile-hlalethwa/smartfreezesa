from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    ReviewListCreateView,
    PayFastInitiateView,
    PayFastNotifyView,
)

urlpatterns = [
    path('',                        OrderListCreateView.as_view()),
    path('<str:order_number>/',     OrderDetailView.as_view()),
    path('reviews/',                ReviewListCreateView.as_view()),
    path('payfast/initiate/',       PayFastInitiateView.as_view()),
    path('payfast/notify/',         PayFastNotifyView.as_view()),
]