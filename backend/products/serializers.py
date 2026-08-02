from rest_framework import serializers
from .models import Fridge


class FridgeSerializer(serializers.ModelSerializer):
    image_url  = serializers.SerializerMethodField()
    image2_url = serializers.SerializerMethodField()

    class Meta:
        model  = Fridge
        fields = [
            'id', 'name', 'brand', 'grade', 'type',
            'price', 'liters', 'energy', 'freezer',
            'noise', 'condition', 'warranty', 'desc',
            'image', 'image_url', 'image2', 'image2_url',
            'is_published', 'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'image':  {'write_only': True, 'required': False},
            'image2': {'write_only': True, 'required': False},
        }

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return ''

    def get_image2_url(self, obj):
        request = self.context.get('request')
        if obj.image2 and request:
            return request.build_absolute_uri(obj.image2.url)
        elif obj.image2:
            return obj.image2.url
        return ''


class FridgeListSerializer(serializers.ModelSerializer):
    image_url  = serializers.SerializerMethodField()
    image2_url = serializers.SerializerMethodField()

    class Meta:
        model  = Fridge
        fields = [
            'id', 'name', 'brand', 'grade', 'type',
            'price', 'liters', 'energy', 'freezer',
            'noise', 'condition', 'warranty', 'desc',
            'image_url', 'image2_url',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return ''

    def get_image2_url(self, obj):
        request = self.context.get('request')
        if obj.image2 and request:
            return request.build_absolute_uri(obj.image2.url)
        elif obj.image2:
            return obj.image2.url
        return ''