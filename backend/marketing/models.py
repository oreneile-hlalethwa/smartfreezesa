from django.db import models


class MarketingSlide(models.Model):
    THEME_CHOICES = [
        ('blue',   'Blue'),
        ('green',  'Green'),
        ('gold',   'Gold'),
        ('purple', 'Purple'),
        ('red',    'Red'),
        ('white',  'White'),
    ]

    tag          = models.CharField(max_length=80)
    title        = models.CharField(max_length=120)  # use \n for line break
    body         = models.TextField()
    theme        = models.CharField(max_length=10, choices=THEME_CHOICES, default='blue')
    image        = models.ImageField(upload_to='slides/', blank=True, null=True)
    order        = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Slide {self.order}: {self.tag}"