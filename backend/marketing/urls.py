from django.urls import path
from . import views

urlpatterns = [
    path('',                       views.SlideListCreateView.as_view(),  name='slide-list-create'),
    path('<int:pk>/',              views.SlideDetailView.as_view(),      name='slide-detail'),
    path('<int:pk>/upload-image/', views.SlideImageUploadView.as_view(), name='slide-image-upload'),
    path('publish/',               views.PublishAllSlidesView.as_view(), name='slides-publish'),
]