from django.shortcuts import render 
from .forms import TimewebForm, TimewebFormList
from .models import TimewebModel
# creating a home view 
def home_view(request): 

    # dictionary for initial data with  
    # field names as keys 
    context = {} 

    # add the dictionary during initialization 
    form = TimewebForm(request.POST or None, request.FILES or None) 
    context['form'] = form

    # check if form data is valid 
    if form.is_valid(): 
        print("Form Values::")
        print(request.POST)
        
        # save the form data to model 
        save_data = form.save(commit=False)
        print("---")
        print(save_data.description)
        print("---")

        save_data.save()
        print("Database saved")

    return render(request, "home.html", context) 

def list_view(request): 

    # dictionary for initial data with  
    # field names as keys 
    context = {}
    form = TimewebFormList(request.POST or None, request.FILES or None) 
    context['form'] = form
    context['allobj'] = 'All Objects:\n'+'\n'.join(obj.__str__() for obj in TimewebModel.objects.all())
    if form.is_valid():
        save_data = form.save(commit=False)
        selected_obj = TimewebModel.objects.get(pk=save_data.enter_id_to_delete)
        selected_obj.delete()
        context['allobj'] = 'All Objects:\n'+'\n'.join(obj.__str__() for obj in TimewebModel.objects.all())
    return render(request, "home_list.html", context) 