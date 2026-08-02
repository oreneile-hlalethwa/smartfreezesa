from django.contrib import admin
from .models import MarketingSlide


@admin.register(MarketingSlide)
class MarketingSlideAdmin(admin.ModelAdmin):
    list_display  = ['tag', 'title', 'theme', 'order', 'is_published']
    list_editable = ['order', 'is_published']
    ordering      = ['order']