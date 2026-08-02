from rest_framework import serializers
from .models import MarketingSlide


class SlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = MarketingSlide
        fields = ['id', 'tag', 'title', 'body', 'theme', 'image', 'image_url',
                  'order', 'is_published', 'created_at', 'updated_at']
        extra_kwargs = {'image': {'write_only': True, 'required': False}}

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return ''