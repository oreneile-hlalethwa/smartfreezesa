from django.contrib import admin
from .models import Order, OrderItem, Review


class OrderItemInline(admin.TabularInline):
    model  = OrderItem
    extra  = 0
    fields = ['name', 'price', 'quantity']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ['order_number', 'name', 'phone', 'city', 'payment', 'status', 'total', 'created_at']
    list_filter   = ['status', 'payment']
    search_fields = ['order_number', 'name', 'phone', 'email']
    list_editable = ['status']
    ordering      = ['-created_at']
    inlines       = [OrderItemInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['fridge', 'name', 'rating', 'created_at']
    list_filter   = ['rating']
    ordering      = ['-created_at']