from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Order, Review
from .serializers import (
    OrderSerializer, OrderCreateSerializer, ReviewSerializer
)


# ── POST /api/orders/  → place new order
# ── GET  /api/orders/  → admin list all orders
class OrderListCreateView(APIView):

    def get(self, request):
        """Admin: list all orders with optional status filter."""
        qs = Order.objects.prefetch_related('items').all()

        s = request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                name__icontains=q
            ) | qs.filter(
                order_number__icontains=q
            ) | qs.filter(
                phone__icontains=q
            )

        serializer = OrderSerializer(qs.distinct(), many=True)
        return Response(serializer.data)

    def post(self, request):
        """Customer: place a new order."""
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── GET   /api/orders/<order_number>/  → track by order number + phone
# ── PATCH /api/orders/<order_number>/  → admin update status
class OrderDetailView(APIView):

    def get(self, request, order_number):
        """Customer tracking — requires phone verification."""
        phone = request.query_params.get('phone', '').strip()
        order = get_object_or_404(Order, order_number=order_number)

        if phone and order.phone.replace(' ', '') != phone.replace(' ', ''):
            return Response(
                {'error': 'Order not found. Please check your order number and phone number.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(OrderSerializer(order).data)

    def patch(self, request, order_number):
        """Admin: advance order status."""
        order = get_object_or_404(Order, order_number=order_number)
        new_status = request.data.get('status')

        valid = ['pending', 'confirmed', 'out_for_delivery', 'delivered']
        if new_status not in valid:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save(update_fields=['status'])
        return Response(OrderSerializer(order).data)


# ── GET  /api/reviews/?fridge=<id>  → get reviews for a fridge
# ── POST /api/reviews/              → submit a review
class ReviewListCreateView(APIView):

    def get(self, request):
        fridge_id = request.query_params.get('fridge')
        if not fridge_id:
            return Response({'error': 'fridge param required'}, status=400)
        reviews = Review.objects.filter(fridge_id=fridge_id)
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        s = ReviewSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)