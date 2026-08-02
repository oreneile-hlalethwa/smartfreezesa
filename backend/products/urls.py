from django.urls import path
from . import views

urlpatterns = [
    path('shop/',                     views.ShopListView.as_view(),          name='shop-list'),
    path('',                          views.FridgeListCreateView.as_view(),  name='fridge-list-create'),
    path('<int:pk>/',                 views.FridgeDetailView.as_view(),      name='fridge-detail'),
    path('<int:pk>/upload-image/',    views.FridgeImageUploadView.as_view(), name='fridge-image-upload'),
    path('<int:pk>/upload-image2/',   views.FridgeImage2UploadView.as_view(),name='fridge-image2-upload'),
    path('publish/',                  views.PublishAllView.as_view(),        name='publish-all'),
]