from django.contrib import admin
from .models import Fridge


@admin.register(Fridge)
class FridgeAdmin(admin.ModelAdmin):
    list_display  = ['name', 'brand', 'grade', 'type', 'price', 'liters', 'is_published', 'updated_at']
    list_filter   = ['grade', 'type', 'is_published', 'brand']
    search_fields = ['name', 'brand', 'desc']
    list_editable = ['is_published']
    ordering      = ['-created_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'brand', 'grade', 'type', 'price', 'liters', 'desc')
        }),
        ('Specs', {
            'fields': ('energy', 'freezer', 'noise', 'condition', 'warranty')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('is_published',)
        }),
    )