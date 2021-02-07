from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.http import JsonResponse
from django.utils import timezone
from .models import TimewebModel
from .forms import TimewebForm
import logging # import the logging library
from django import forms
import datetime
class TimewebView(View):

    # Get an instance of a logger
    logger = logging.getLogger(__name__)

    def __init__(self):
        self.context = {}

    def make_form_instance(self,request,pk):

        # Creates form after user enters "New" 
        if pk == None:
            self.form = TimewebForm(request.POST or None, request.FILES or None)
            self.context['submit'] = 'Create Assignment'
        else:
            self.selectedform = get_object_or_404(TimewebModel, pk=pk) # User data from modelform
            # Create a form instance from user data
            initial = {
                'file_sel':self.selectedform.file_sel,
                'ad':self.selectedform.ad,
                'x':self.selectedform.x,
                'unit':self.selectedform.unit,
                'y':self.selectedform.y,
                'works':self.selectedform.works[0],
                'ctime':self.selectedform.ctime,
                'nwd':self.selectedform.nwd,
            }
            if self.selectedform.funct_round != 1:
                initial['funct_round'] = self.selectedform.funct_round
            if self.selectedform.min_work_time*self.selectedform.ctime:
                initial['min_work_time'] = round(self.selectedform.min_work_time*self.selectedform.ctime,2) # Decimal module mutiplication adds siginficant figures
            self.form = TimewebForm(request.POST or None, request.FILES or None,initial=initial)
            self.context['submit'] = 'Update Assignment'
            self.context['checked_nwd'] = self.selectedform.nwd
        
        self.context['form'] = self.form
    
    # User makes new assignment
    def get(self,request,pk=None):
        
        self.make_form_instance(request,pk)
        return render(request, "new.html", self.context)

    def post(self,request,pk=None):
        self.make_form_instance(request,pk)
        if self.form.is_valid() and 'submit-button' in request.POST:
            if pk == None: # Handle "new"
                save_data = self.form.save(commit=False)
                save_data.dif_assign = 0
                save_data.skew_ratio = 1 # Change to def_skew_ratio
                save_data.fixed_mode = False
                save_data.remainder_mode = False
                adone = save_data.works
            else: #Handle "Update"
                # Save the form and convert it back to a model
                old_data = get_object_or_404(TimewebModel, pk=pk)
                form_data = self.form.save(commit=False)
                save_data = get_object_or_404(TimewebModel, pk=pk)
                save_data.file_sel = form_data.file_sel
                save_data.ad = form_data.ad
                save_data.x = form_data.x
                save_data.unit = form_data.unit
                save_data.y = form_data.y
                adone = form_data.works
                # save_data.dif_assign = form_data.dif_assign no reason to define since its null
                save_data.skew_ratio = form_data.skew_ratio
                save_data.ctime = form_data.ctime
                save_data.funct_round = form_data.funct_round
                save_data.min_work_time = form_data.min_work_time
                save_data.nwd = form_data.nwd
                save_data.fixed_mode = form_data.fixed_mode
                # save_data.dynamic_start = form_data.dynamic_start no reason to define since its null
                save_data.remainder_mode = form_data.remainder_mode
            
            if any(save_data.file_sel == obj.file_sel for obj in TimewebModel.objects.all().exclude(pk=pk)):
                self.context['error'] = 'Name has already been taken!'
                return render(request, "new.html", self.context)

            date_now = timezone.localtime(timezone.now()).date()
            if save_data.ad == date_now:
                save_data.dynamic_start = 0 # May not be needed
            else:
                if pk == None:
                    if date_now >= save_data.ad:
                        save_data.dif_assign = (date_now-save_data.ad).days
                    save_data.dynamic_start = save_data.dif_assign
                else:
                    if date_now < old_data.ad or old_data.dif_assign + (old_data.ad-save_data.ad).days < 0:
                        save_data.dif_assign = 0
                    else:
                        save_data.dif_assign = old_data.dif_assign + (old_data.ad-save_data.ad).days
            
            if save_data.x < save_data.ad:
                self.context['error'] = 'Assignment date cannot be before due date!'
                return render(request, "new.html", self.context)
            elif save_data.x == save_data.ad:
                self.context['error'] = 'Assignment date cannot be on the due date!'
                return render(request, "new.html", self.context)
           
            if adone >= save_data.y:
                self.context['error'] = 'Adone cannot be greater than or equal to y!'
                return render(request, "new.html", self.context)
                
            if not save_data.funct_round:
                save_data.funct_round = 1

            if save_data.min_work_time:
                save_data.min_work_time /= save_data.ctime
            else:
                save_data.min_work_time = 0

            x_num = (save_data.x - save_data.ad).days
            if pk == None:
                save_data.works = [adone]
            else:
                removed_works_start = (save_data.ad - old_data.ad).days - save_data.dif_assign
                if removed_works_start < 0:
                    removed_works_start = 0
                removed_works_end = len(save_data.works) - 1

                # If the reentered due date cuts off some of the work inputs, remove the work input for the last day because that must complete assignment
                if removed_works_end >= x_num - save_data.dif_assign:# and x != None:
                    removed_works_end = x_num - save_data.dif_assign
                    if save_data.works[removed_works_end] != save_data.y:
                        removed_works_end -= 1
                    
                if removed_works_start <= removed_works_end:
                    save_data.works = [save_data.works[n] - save_data.works[0] + adone for n in range(removed_works_start,removed_works_end+1)]
                if save_data.dynamic_start or not old_data.dif_assign:
                    save_data.dynamic_start += save_data.dif_assign - old_data.dif_assign
                if save_data.dynamic_start < 0:
                    save_data.dynamic_start = 0
            if pk != None and save_data.dynamic_start > x_num - 1:
                save_data.dynamic_start = x_num - 1
            save_data.save()
            self.logger.debug("Updated/Added Model")
            return redirect('../')
        else:
            self.logger.debug("Invalid Form")
            return render(request, "new.html", self.context)

class TimewebListView(View):
    logger = logging.getLogger(__name__)
    def __init__(self):
        self.context = {}

    def make_list(self):
        objlist = TimewebModel.objects.all()
        self.context['objlist'] = objlist
        self.context['data'] = [[50, 25, 1, (4,), True, True, True, False, 0]] + [list(vars(obj).values())[2:] for obj in objlist]
    def get(self,request):
        self.make_list()
        return render(request, "list.html", self.context)
    
    # An example of request.POST after delete is pressed:
    # <QueryDict: {'title': ['yyy'], 'description': ['test'], 'delete-button': ['']}>
    # As you can see, the name of the submit button is passed on to request.POST
    # However, it still cannot be referanced because 'delete-button': [''] is not a good indication
    # So, pass in a value into the button such that the new request.POST will have delete-button': ['deleted'] instead
    def post(self,request):
        for key, value in request.POST.items():
            if key == "deleted":
                pk = value
                selected_model = get_object_or_404(TimewebModel, pk=pk)
                selected_model.delete()
                self.logger.debug("Deleted")
            elif key == "skew_ratio":
                pk = request.POST['pk']
                selected_model = get_object_or_404(TimewebModel, pk=pk)
                selected_model.skew_ratio = value
                selected_model.save()
                self.logger.debug("Skew ratio saved")
        self.make_list()
        return render(request, "list.html", self.context)