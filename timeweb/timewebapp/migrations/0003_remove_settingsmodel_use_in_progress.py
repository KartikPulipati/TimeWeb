# Generated by Django 3.2.11 on 2022-02-01 08:25

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('timewebapp', '0002_alter_settingsmodel_one_graph_at_a_time'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='settingsmodel',
            name='use_in_progress',
        ),
    ]
