# Generated by Django 3.1.8 on 2021-04-18 20:03

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timewebapp', '0020_auto_20210418_1048'),
    ]

    operations = [
        migrations.AddField(
            model_name='settingsmodel',
            name='show_info_buttons',
            field=models.BooleanField(default=False, verbose_name='Show Info Buttons'),
        ),
        migrations.AlterField(
            model_name='timewebmodel',
            name='y',
            field=models.DecimalField(decimal_places=2, max_digits=15, validators=[django.core.validators.MinValueValidator(1, "This field's value can't be less than %(limit_value)s")]),
        ),
    ]
