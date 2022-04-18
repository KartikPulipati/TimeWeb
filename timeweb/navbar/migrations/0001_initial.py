# Generated by Django 3.2.12 on 2022-04-17 07:16

import colorfield.fields
from decimal import Decimal
from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import multiselectfield.db.fields
import timewebapp.models
import timezone_field.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SettingsModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('def_break_days', multiselectfield.db.fields.MultiSelectField(blank=True, choices=[('1', 'Mon'), ('2', 'Tue'), ('3', 'Wed'), ('4', 'Thu'), ('5', 'Fri'), ('6', 'Sat'), ('0', 'Sun')], max_length=13, null=True, verbose_name='Default Work Days')),
                ('def_min_work_time', models.DecimalField(blank=True, decimal_places=2, default=15, max_digits=15, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0'), 'The default minimum work time must be positive or zero')], verbose_name='Default Minimum Daily Work Time')),
                ('def_due_time', models.TimeField(default=timewebapp.models.get_midnight_time, verbose_name='Default Due Time')),
                ('def_funct_round_minute', models.BooleanField(default=False, verbose_name='Round to Multiples of 5 Minutes')),
                ('def_skew_ratio', models.DecimalField(decimal_places=10, default=1, max_digits=17, verbose_name='Default Curvature')),
                ('ignore_ends', models.BooleanField(default=False, verbose_name='Ignore Minimum Work Time Ends')),
                ('one_graph_at_a_time', models.BooleanField(default=False, verbose_name='Allow Only One Open Graph at a Time')),
                ('close_graph_after_work_input', models.BooleanField(default=False, verbose_name='Close Graph After Submitting Work Input')),
                ('show_priority', models.BooleanField(default=True, verbose_name='Show Priority')),
                ('highest_priority_color', colorfield.fields.ColorField(default='#e8564a', max_length=18, verbose_name='Highest Priority Color')),
                ('lowest_priority_color', colorfield.fields.ColorField(default='#84d336', max_length=18, verbose_name='Lowest Priority Color')),
                ('assignment_sorting', models.CharField(choices=[('Normal', 'Normal'), ('Reversed', 'Reversed'), ('Tag Name', 'Tag Name')], default='Normal', max_length=8, verbose_name='Assignment Sorting: ')),
                ('default_dropdown_tags', models.JSONField(blank=True, default=timewebapp.models.empty_list, verbose_name='Default Dropdown Tags')),
                ('horizontal_tag_position', models.CharField(choices=[('Left', 'Left'), ('Middle', 'Middle'), ('Right', 'Right')], default='Middle', max_length=6, verbose_name='Horizontal Assignment Tag Position')),
                ('vertical_tag_position', models.CharField(choices=[('Top', 'Top'), ('Bottom', 'Bottom')], default='Top', max_length=6, verbose_name='Vertical Assignment Tag Position')),
                ('background_image', models.ImageField(blank=True, null=True, upload_to=timewebapp.models.create_image_path, verbose_name='Background Image')),
                ('dark_mode', models.BooleanField(default=False, verbose_name='Dark Mode')),
                ('animation_speed', models.CharField(choices=[('1', 'Normal (1x)'), ('0.5', 'Fast (2x)'), ('0', 'None (No animation)')], default='1', max_length=19, verbose_name='Animation Speed')),
                ('restore_gc_assignments', models.BooleanField(default=False, verbose_name='Restore Deleted Google Classroom Assignments')),
                ('timezone', timezone_field.fields.TimeZoneField(blank=True, null=True)),
                ('enable_tutorial', models.BooleanField(default=True, verbose_name='Tutorial')),
                ('oauth_token', models.JSONField(blank=True, default=timewebapp.models.empty_dict)),
                ('added_gc_assignment_ids', models.JSONField(blank=True, default=timewebapp.models.empty_list)),
                ('seen_latest_changelog', models.BooleanField(default=True)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
