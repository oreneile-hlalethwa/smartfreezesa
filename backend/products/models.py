from django.db import models


class Fridge(models.Model):
    GRADE_CHOICES = [
        ('N', 'New Condition'),
        ('A', 'A Grade'),
        ('B', 'B Grade'),
    ]
    TYPE_CHOICES = [
        ('topfreezer', 'Top Freezer'),
        ('bar',        'Bar Fridge'),
    ]
    CONDITION_CHOICES = [
        ('Like New',  'Like New'),
        ('Excellent', 'Excellent'),
        ('Very Good', 'Very Good'),
        ('Good',      'Good'),
        ('Fair',      'Fair'),
    ]
    FREEZER_CHOICES = [
        ('Yes', 'Yes'),
        ('No',  'No'),
    ]

    # ── Core fields ─────────────────────────────
    name        = models.CharField(max_length=120)
    brand       = models.CharField(max_length=80)
    grade       = models.CharField(max_length=1,  choices=GRADE_CHOICES, default='B')
    type        = models.CharField(max_length=20, choices=TYPE_CHOICES,  default='topfreezer')
    price       = models.PositiveIntegerField(default=0)
    liters      = models.PositiveIntegerField(default=0)

    # ── Specs ────────────────────────────────────
    energy      = models.CharField(max_length=10, blank=True)   # e.g. A++
    freezer     = models.CharField(max_length=3,  choices=FREEZER_CHOICES, default='No')
    noise       = models.CharField(max_length=20, blank=True)   # e.g. 38 dB
    condition   = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='Good')
    warranty    = models.CharField(max_length=40, default='3 months')
    desc        = models.TextField(blank=True)

    # ── Image ────────────────────────────────────
    image       = models.ImageField(upload_to="fridges/", blank=True, null=True)
    image2      = models.ImageField(upload_to="fridges/", blank=True, null=True)

    # ── Status ───────────────────────────────────
    is_published = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.brand}) — {self.get_grade_display()}"

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return ''