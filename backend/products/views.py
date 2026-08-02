from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import Fridge
from .serializers import FridgeSerializer, FridgeListSerializer


# ────────────────────────────────────────────────
#  CUSTOMER-FACING  — GET /api/products/shop/
#  Returns only published fridges.
#  Supports query params: grade, type, max_price
# ────────────────────────────────────────────────
class ShopListView(APIView):
    def get(self, request):
        qs = Fridge.objects.filter(is_published=True)

        grade     = request.query_params.get('grade')
        ftype     = request.query_params.get('type')
        max_price = request.query_params.get('max_price')

        if grade and grade != 'all':
            qs = qs.filter(grade=grade)
        if ftype:
            qs = qs.filter(type=ftype)
        if max_price:
            try:
                qs = qs.filter(price__lte=int(max_price))
            except ValueError:
                pass

        serializer = FridgeListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


# ────────────────────────────────────────────────
#  ADMIN — GET/POST  /api/products/
#  GET  → all fridges (published + drafts)
#  POST → create new fridge (multipart for image)
# ────────────────────────────────────────────────
class FridgeListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs         = Fridge.objects.all()
        serializer = FridgeSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = FridgeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ────────────────────────────────────────────────
#  ADMIN — GET/PATCH/DELETE  /api/products/<id>/
# ────────────────────────────────────────────────
class FridgeDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        fridge     = get_object_or_404(Fridge, pk=pk)
        serializer = FridgeSerializer(fridge, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        fridge     = get_object_or_404(Fridge, pk=pk)
        serializer = FridgeSerializer(
            fridge, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        fridge = get_object_or_404(Fridge, pk=pk)
        if fridge.image:
            fridge.image.delete(save=False)
        fridge.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ────────────────────────────────────────────────
#  ADMIN — POST /api/products/publish/
#  Marks ALL fridges as published in one shot
#  (mirrors the "Publish to Shop" button)
# ────────────────────────────────────────────────
class PublishAllView(APIView):
    def post(self, request):
        # Optional: accept a list of IDs to publish selectively
        ids = request.data.get('ids')
        if ids:
            qs = Fridge.objects.filter(pk__in=ids)
        else:
            qs = Fridge.objects.all()

        count = qs.update(is_published=True)
        return Response({'published': count, 'message': f'{count} fridges now live on shop'})


# ────────────────────────────────────────────────
#  ADMIN — POST /api/products/<id>/upload-image/
#  Separate endpoint for image-only updates
#  (matches the card's "Upload Photo" flow)
# ────────────────────────────────────────────────
class FridgeImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        fridge = get_object_or_404(Fridge, pk=pk)
        image  = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Delete old image from disk
        if fridge.image:
            fridge.image.delete(save=False)

        fridge.image = image
        fridge.save(update_fields=['image'])

        serializer = FridgeSerializer(fridge, context={'request': request})
        return Response({
            'image_url': serializer.data['image_url'],
            'message':   'Image uploaded successfully',
        })


# ────────────────────────────────────────────────
#  ADMIN — POST /api/products/<id>/upload-image2/
#  Second photo upload endpoint
# ────────────────────────────────────────────────
class FridgeImage2UploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        fridge = get_object_or_404(Fridge, pk=pk)
        image  = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        if fridge.image2:
            fridge.image2.delete(save=False)

        fridge.image2 = image
        fridge.save(update_fields=['image2'])

        serializer = FridgeSerializer(fridge, context={'request': request})
        return Response({
            'image_url': serializer.data['image2_url'],
            'message':   'Second image uploaded successfully',
        })