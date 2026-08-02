from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from .models import MarketingSlide
from .serializers import SlideSerializer


class SlideListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        # ?published=true  → customer carousel
        published = request.query_params.get('published')
        qs = MarketingSlide.objects.filter(is_published=True) if published else MarketingSlide.objects.all()
        return Response(SlideSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        s = SlideSerializer(data=request.data, context={'request': request})
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class SlideDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        slide = get_object_or_404(MarketingSlide, pk=pk)
        s = SlideSerializer(slide, data=request.data, partial=True, context={'request': request})
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        slide = get_object_or_404(MarketingSlide, pk=pk)
        if slide.image:
            slide.image.delete(save=False)
        slide.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SlideImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        slide = get_object_or_404(MarketingSlide, pk=pk)
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=400)
        if slide.image:
            slide.image.delete(save=False)
        slide.image = image
        slide.save(update_fields=['image'])
        s = SlideSerializer(slide, context={'request': request})
        return Response({'image_url': s.data['image_url']})


class PublishAllSlidesView(APIView):
    def post(self, request):
        ids = request.data.get('ids')
        qs  = MarketingSlide.objects.filter(pk__in=ids) if ids else MarketingSlide.objects.all()
        count = qs.update(is_published=True)
        return Response({'published': count})