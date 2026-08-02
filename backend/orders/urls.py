from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<str:order_number>/',     views.OrderDetailView.as_view(),     name='order-detail'),
    path('reviews/',                views.ReviewListCreateView.as_view(),name='review-list-create'),  # note: registered separately in root urls
]