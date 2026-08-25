from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import Fridge
from .serializers import FridgeSerializer, FridgeListSerializer


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
        try:
            if fridge.image:
                fridge.image.delete(save=False)
            if fridge.image2:
                fridge.image2.delete(save=False)
        except Exception:
            pass
        fridge.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublishAllView(APIView):
    def post(self, request):
        ids = request.data.get('ids')
        if ids:
            qs = Fridge.objects.filter(pk__in=ids)
        else:
            qs = Fridge.objects.all()
        count = qs.update(is_published=True)
        return Response({'published': count, 'message': f'{count} fridges now live on shop'})


class FridgeImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        fridge = get_object_or_404(Fridge, pk=pk)
        image  = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if fridge.image:
                fridge.image.delete(save=False)
        except Exception:
            pass
        fridge.image = image
        fridge.save(update_fields=['image'])
        serializer = FridgeSerializer(fridge, context={'request': request})
        return Response({
            'image_url': serializer.data['image_url'],
            'message':   'Image uploaded successfully',
        })


class FridgeImage2UploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        fridge = get_object_or_404(Fridge, pk=pk)
        image  = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if fridge.image2:
                fridge.image2.delete(save=False)
        except Exception:
            pass
        fridge.image2 = image
        fridge.save(update_fields=['image2'])
        serializer = FridgeSerializer(fridge, context={'request': request})
        return Response({
            'image_url': serializer.data['image2_url'],
            'message':   'Second image uploaded successfully',
        })