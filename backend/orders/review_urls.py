from django.urls import path
from orders.views import ReviewListCreateView

urlpatterns = [
    path('', ReviewListCreateView.as_view(), name='reviews'),
]