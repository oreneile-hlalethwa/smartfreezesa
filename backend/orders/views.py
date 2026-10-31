import hashlib
import urllib.parse
import requests
from decouple import config

from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Order, Review
from .serializers import (
    OrderSerializer, OrderCreateSerializer, ReviewSerializer
)

PAYFAST_MERCHANT_ID  = config('PAYFAST_MERCHANT_ID',  default='37134085')
PAYFAST_MERCHANT_KEY = config('PAYFAST_MERCHANT_KEY', default='ozpordlwgvtxe')
PAYFAST_PASSPHRASE   = config('PAYFAST_PASSPHRASE',   default='SamkeloK51..')
PAYFAST_SANDBOX      = config('PAYFAST_SANDBOX',       default='False') == 'True'

PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process' if PAYFAST_SANDBOX else 'https://www.payfast.co.za/eng/process'


# ── EMAIL HELPER ──────────────────────────────────────────────────────────────
def send_order_confirmation_email(order):
    frontend_url  = config('FRONTEND_URL', default='https://smartfreezesa.onrender.com')
    tracking_url  = f"{frontend_url}/frontend/EndUserDashboard/track.html?order={order.order_number}"

    subject = f"SmartFreeze — Order Confirmed {order.order_number}"
    message = f"""
Hi {order.name},

Your SmartFreeze order has been confirmed and payment received!

Order Number : {order.order_number}
Total        : R{order.total}
Delivery     : {order.address}, {order.city}

Track your order here:
{tracking_url}

Our team will contact you shortly to arrange delivery.

Thank you for choosing SmartFreeze SA!
SmartFreeze SA — Delivering Cold Across South Africa
    """.strip()

    try:
        send_mail(
            subject,
            message,
            config('EMAIL_HOST_USER', default='Smartfreezesa@gmail.com'),
            [order.email],
            fail_silently=False,
        )
        print(f"Confirmation email sent to {order.email}")
    except Exception as e:
        print(f"Email failed: {e}")


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


# ── POST /api/orders/payfast/initiate/  → generate PayFast payment data
class PayFastInitiateView(APIView):

    def post(self, request):
        order_number = request.data.get('order_number')
        if not order_number:
            return Response({'error': 'order_number required'}, status=400)

        order = get_object_or_404(Order, order_number=order_number)

        base_url = config('FRONTEND_URL', default='https://smartfreezesa.onrender.com')

        data = {
            'merchant_id':      PAYFAST_MERCHANT_ID,
            'merchant_key':     PAYFAST_MERCHANT_KEY,
            'return_url':       f'{base_url}/frontend/EndUser/payment-success.html?order={order_number}',
            'cancel_url':       f'{base_url}/frontend/EndUser/payment-cancel.html?order={order_number}',
            'notify_url':       f'{config("BACKEND_URL", default="https://smartfreezesa.onrender.com")}/api/orders/payfast/notify/',
            'name_first':       order.name.split()[0],
            'name_last':        order.name.split()[-1] if len(order.name.split()) > 1 else '',
            'email_address':    order.email or '',
            'cell_number':      order.phone,
            'm_payment_id':     order_number,
            'amount':           f'{order.total:.2f}',
            'item_name':        f'SmartFreeze Order {order_number}',
            'item_description': f'Fridge order - {order_number}',
        }

        signature = self._generate_signature(data)
        data['signature'] = signature

        return Response({
            'payfast_url': PAYFAST_URL,
            'data':        data,
        })

    def _generate_signature(self, data):
        param_string = '&'.join(
            f'{k}={urllib.parse.quote_plus(str(v))}'
            for k, v in data.items()
            if v != ''
        )
        if PAYFAST_PASSPHRASE:
            param_string += f'&passphrase={urllib.parse.quote_plus(PAYFAST_PASSPHRASE)}'
        return hashlib.md5(param_string.encode()).hexdigest()


# ── POST /api/orders/payfast/notify/  → PayFast ITN webhook
@method_decorator(csrf_exempt, name='dispatch')
class PayFastNotifyView(APIView):

    def post(self, request):
        data = request.POST.dict()

        # verify with PayFast
        try:
            pf_url = 'https://sandbox.payfast.co.za/eng/query/validate' if PAYFAST_SANDBOX else 'https://www.payfast.co.za/eng/query/validate'
            response = requests.post(pf_url, data=data, timeout=10)
            valid = response.text == 'VALID'
        except Exception:
            valid = False

        if not valid:
            return Response({'error': 'Invalid ITN'}, status=400)

        payment_status = data.get('payment_status')
        order_number   = data.get('m_payment_id')

        try:
            order = Order.objects.get(order_number=order_number)
            if payment_status == 'COMPLETE':
                order.payment_status = 'paid'
                order.status         = 'confirmed'
                order.save(update_fields=['payment_status', 'status'])
                send_order_confirmation_email(order)
            elif payment_status == 'FAILED':
                order.payment_status = 'failed'
                order.save(update_fields=['payment_status'])
        except Order.DoesNotExist:
            pass

        return Response({'status': 'ok'})