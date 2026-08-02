from django.db import models
import uuid


def generate_order_number():
    from django.utils import timezone
    from .models import Order
    today   = timezone.now().strftime('%Y%m%d')
    count   = Order.objects.filter(created_at__date=timezone.now().date()).count() + 1
    return f'SF-{today}-{str(count).zfill(3)}'


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',          'Pending'),
        ('confirmed',        'Confirmed'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered',        'Delivered'),
    ]
    PAYMENT_CHOICES = [
        ('cod',    'Cash on Delivery'),
        ('online', 'Online / Card'),
    ]

    order_number = models.CharField(max_length=30, unique=True, blank=True)
    name         = models.CharField(max_length=120)
    email        = models.EmailField()
    phone        = models.CharField(max_length=20)
    address      = models.TextField()
    city         = models.CharField(max_length=80)
    payment      = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='cod')
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES,  default='pending')
    total        = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            count = Order.objects.filter(created_at__date=timezone.now().date()).count() + 1
            self.order_number = f'SF-{today}-{str(count).zfill(3)}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.order_number} — {self.name}'


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    fridge   = models.ForeignKey('products.Fridge', on_delete=models.SET_NULL, null=True)
    name     = models.CharField(max_length=120)  # snapshot at time of order
    price    = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'{self.name} x{self.quantity}'


class Review(models.Model):
    fridge     = models.ForeignKey('products.Fridge', on_delete=models.CASCADE, related_name='reviews')
    name       = models.CharField(max_length=80)
    rating     = models.PositiveSmallIntegerField()   # 1–5
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.fridge.name} — {self.rating}★ by {self.name}'