from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    Django uses username not email by default — we look up by email first.
    """
    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Look up user by email
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verify password
        user = authenticate(request, username=user.username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_staff:
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token':    token.key,
            'username': user.username,
            'email':    user.email,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Deletes the token — user must login again.
    """
    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            Token.objects.filter(key=token_key).delete()
        return Response({'message': 'Logged out successfully.'})


class VerifyTokenView(APIView):
    """
    GET /api/auth/verify/
    Used by dashboard pages on load to check if token is still valid.
    """
    def get(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)

        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.select_related('user').get(key=token_key)
            if not token.user.is_staff:
                return Response({'valid': False}, status=status.HTTP_403_FORBIDDEN)
            return Response({'valid': True, 'username': token.user.username})
        except Token.DoesNotExist:
            return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)