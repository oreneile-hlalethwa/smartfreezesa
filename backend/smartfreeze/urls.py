from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',          admin.site.urls),
    path('api/auth/',       include('smartfreeze.auth_urls')),
    path('api/products/',   include('products.urls')),
    path('api/marketing/',  include('marketing.urls')),
    path('api/orders/',     include('orders.urls')),
    path('api/reviews/',    include('orders.review_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)