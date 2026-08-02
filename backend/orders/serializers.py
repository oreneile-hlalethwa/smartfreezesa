from rest_framework import serializers
from .models import Order, OrderItem, Review


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['id', 'fridge', 'name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'name', 'email', 'phone',
            'address', 'city', 'payment', 'status', 'total',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['order_number', 'status', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    """Used for POST /api/orders/ — accepts cart items inline."""
    name    = serializers.CharField(max_length=120)
    email   = serializers.EmailField()
    phone   = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city    = serializers.CharField(max_length=80)
    payment = serializers.ChoiceField(choices=['cod', 'online'])
    items   = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )

    def create(self, validated_data):
        from products.models import Fridge
        items_data = validated_data.pop('items')

        total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items_data)
        order = Order.objects.create(total=total, **validated_data)

        for item in items_data:
            fridge = Fridge.objects.filter(pk=item.get('fridge_id')).first()
            OrderItem.objects.create(
                order    = order,
                fridge   = fridge,
                name     = item.get('name', ''),
                price    = item.get('price', 0),
                quantity = item.get('quantity', 1),
            )

        return order


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Review
        fields = ['id', 'fridge', 'name', 'rating', 'comment', 'created_at']
        read_only_fields = ['created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value