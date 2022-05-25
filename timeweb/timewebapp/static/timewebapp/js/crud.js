class Crud {
    static getDefaultAssignmentFormFields = _ => ({
        "#id_name": '',
        "#id_assignment_date_daterangepicker": utils.formatting.stringifyDate(date_now),
        "#id_x_daterangepicker": (function() {
            const due_time = new Date(date_now.valueOf());
            due_time.setMinutes(SETTINGS.def_due_time.hour * 60 + SETTINGS.def_due_time.minute);
            return moment(due_time);
        })(),
        "#id_x": (function() {
            $("#due-date-empty").click();
            return "";
        })(),
        "#id_soft": false,
        "#id_unit": '',
        "#id_y": '',
        "#id_works": 0,
        "#id_time_per_unit": '',
        "#id_description": '',
        "#id_funct_round": 1,
        "#id_min_work_time": +SETTINGS.def_min_work_time||'',
        "#id_break_days": SETTINGS.def_break_days,
    })
    static generateAssignmentFormFields = sa => {
        const fields = {
            "#id_name": sa.name,
            "#id_assignment_date_daterangepicker": sa.fake_assignment_date ? "" : utils.formatting.stringifyDate(sa.assignment_date),
            "#id_x_daterangepicker": (function() {
                const due_date = new Date(sa.assignment_date.valueOf());
                if (!sa.complete_x) {
                    due_date.setMinutes(SETTINGS.def_due_time.hour * 60 + SETTINGS.def_due_time.minute);
                    return moment(due_date);
                }
                due_date.setDate(due_date.getDate() + Math.floor(sa.complete_x));
                if (sa.due_time && (sa.due_time.hour || sa.due_time.minute)) {
                    due_date.setMinutes(due_date.getMinutes() + sa.due_time.hour * 60 + sa.due_time.minute);
                }
                return moment(due_date);
            })(),
            "#id_soft": sa.soft,
            "#id_unit": sa.unit,
            "#id_y": sa.y,
            "#id_time_per_unit": sa.time_per_unit,
            "#id_description": sa.description,
            "#id_works": sa.works[0],
            "#id_funct_round": sa.funct_round,
            "#id_min_work_time": Number.isFinite(sa.original_min_work_time) ? sa.original_min_work_time : '',
            "#id_break_days": sa.break_days,
        }
        if (!sa.complete_x) fields["#id_x"] = "";
        return fields;
    }
    static setAssignmentFormFields(formDict) {
        for (let [field, value] of Object.entries(formDict)) {
            if (field === "#id_break_days") continue;
            if (field === "#id_unit") {
                const normalized_value = pluralize(value, 1).toLowerCase();
                if (normalized_value === "minute") {
                    $("#y-widget-checkbox").prop("checked", false);
                    continue;
                } else if (normalized_value === "hour") {
                    $("#y-widget-checkbox").prop("checked", true);
                    continue;
                }
            }
            
            const field_is_daterangepicker = field.endsWith("_daterangepicker");
            if (field_is_daterangepicker) field = field.replace("_daterangepicker", "");

            const $field = $(field);
            if ($field.attr("type") === "checkbox")
                $field.prop("checked", value);
            else if (field_is_daterangepicker) {
                $field.data("daterangepicker").setStartDate(value);
                $field.data("daterangepicker").setEndDate(value);
            } else
                $field.val(value);
        }
        for (let break_day of Array(7).keys()) {
            // (break_day+6)%7) is for an ordering issue, ignore that
            // Treat this as $("#id_break_days_"+break_day)
            $(`#id_break_days_${(break_day+6) % 7}`).prop("checked", formDict["#id_break_days"].includes(break_day));
        }
    }
    static DEFAULT_DATERANGEPICKER_OPTIONS = {
        buttonClasses: "generic-button",
        parentEl: "main",
        showDropdowns: true,
        singleDatePicker: true,
    }
    static ALL_FOCUSABLE_FORM_INPUTS = (function() {
        $(function() {
            // https://stackoverflow.com/questions/7668525/is-there-a-jquery-selector-to-get-all-elements-that-can-get-focus
            Crud.ALL_FOCUSABLE_FORM_INPUTS = $('#fields-wrapper').find("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]")
                .filter(function() {
                    return !$(this).attr("name")?.endsWith("-widget-checkbox");
                });
        });
    })()
    static FORM_ANIMATION_DURATION = 300
    static FORM_POSITION_TOP = 15
    static DELETE_ASSIGNMENT_TRANSITION_DURATION = 750 * SETTINGS.animation_speed
    static STEP_SIZE_AUTO_LOWER_ROUND = 0.05

    static RESET_FORM_GROUP_MARGINS = () => {
        $("#form-wrapper #fields-wrapper").prop("style").setProperty("--first-field-group-height", 
            // Let's not apply any of the weird margin logic to the first field group; its height will remain static when tabbed into this field
            $("#form-wrapper #first-field-group").outerHeight()
        + "px");
        $("#form-wrapper #fields-wrapper").prop("style").setProperty("--second-field-group-height",
            $("#form-wrapper #second-field-group").outerHeight() +
            $("#form-wrapper #second-field-group .field-wrapper").toArray().map(function(field_wrapper_dom) {
                if ($(field_wrapper_dom).css("margin-top") === field_wrapper_dom.style.marginTop) return 0;
                return parseFloat(field_wrapper_dom.style.marginTop) || 0;
            }).reduce((a, b) => a + b, 0)
        + "px");
    }

    static GO_TO_FIELD_GROUP = params => {
        if (params.standard) {   
            $("#form-wrapper #field-group-picker-checkbox").prop("checked", false);
        } else if (params.advanced) {
            $("#form-wrapper #field-group-picker-checkbox").prop("checked", true);
        } else if (params.toggle) {
            $("#form-wrapper #field-group-picker-checkbox").click();
        }
        Crud.RESET_FORM_GROUP_MARGINS();
    }
    init() {
        const that = this;
        $("#id_assignment_date").daterangepicker({
            ...Crud.DEFAULT_DATERANGEPICKER_OPTIONS,
            autoApply: true,
            locale: {
                format: 'MM/DD/YYYY'
            },
        });
        let old_due_date_val;
        $("#id_x").daterangepicker({
            ...Crud.DEFAULT_DATERANGEPICKER_OPTIONS,
            locale: {
                format: 'MM/DD/YYYY h:mm A'
            },
            timePicker: true,
        }).on('show.daterangepicker', function(e, picker) {
            old_due_date_val = $(this).val();
        }).on('hide.daterangepicker', function(e, picker) {
            setTimeout(() => {
                if (!$(this).val()) {
                    $("#due-date-empty").click();
                    return;
                }

                $("#form-wrapper #due-date-text-measurer").text($(this).val());
                $(this).parents(".field-wrapper").prop("style").setProperty("--due-date-text-width", $("#form-wrapper #due-date-text-measurer").width() + "px");
            }, 0);
        }).on('cancel.daterangepicker', function(e, picker) {
            $(this).val(old_due_date_val);
        });
        $("#due-date-empty").click(function() {
            $("#id_x").val("");
            $(this).parents(".field-wrapper").prop("style").removeProperty("--due-date-text-width");
        });
        that.setCrudHandlers();
        that.addInfoButtons();

        if ($(".assignment-form-error-note").length) {
            that.showForm({ show_instantly: true });
        } else {
            that.hideForm({ hide_instantly: true });
        }
    }
    showForm(params={show_instantly: false}) {
        const that = this;
        setTimeout(function() {
            $("#id_description").trigger("input");
            $("#id_x").trigger("hide.daterangepicker");
        }, 0);
        if (params.show_instantly) {
            $('#overlay').show().children("#form-wrapper").css("top", Crud.FORM_POSITION_TOP);
        } else {
            $("#overlay").fadeIn(Crud.FORM_ANIMATION_DURATION).children("#form-wrapper").animate({top: Crud.FORM_POSITION_TOP}, Crud.FORM_ANIMATION_DURATION);
            if (!isMobile) {
                $("form input:visible").first().focus();
            } else {
                $(document.activeElement).blur();
            }
        }
        $("main").css("overflow-y", "hidden");
        that.old_unit_value = undefined;
        that.replaceUnit();

        setTimeout(function() {
            if ($("#form-wrapper #second-field-group .invalid").length) {
                Crud.GO_TO_FIELD_GROUP({advanced: true});
            }
        }, 0);
    }
    hideForm(params={hide_instantly: false}) {
        const that = this;
        if (params.hide_instantly) {
            $("#overlay").hide().children("#form-wrapper");
            $(".assignment-form-error-note").remove(); // Remove all error notes when form is exited
        } else {
            $("#overlay").fadeOut(Crud.FORM_ANIMATION_DURATION, function() {
                // Remove all error notes when form is exited
                $(".invalid").removeClass("invalid");
                $(".assignment-form-error-note").remove();
                Crud.GO_TO_FIELD_GROUP({standard: true});
            }).children("#form-wrapper").animate({top: 0}, Crud.FORM_ANIMATION_DURATION);
        }
        // Fallback if "overlay" doesn't exist
        $("main").css("overflow-y", "scroll");
        $("main").css("overflow-y", "overlay");
    }
    replaceUnit() {
        const that = this;
        const val = $("#id_unit").val().trim() || $("#id_y ~ .field-widget").getPseudoStyle("::after", "content").slice(1, -1);
        const plural = pluralize(val),
            singular = pluralize(val, 1);
        $("label[for='id_funct_round'] ~ .info-button .info-button-text").text(`This is the number of ${plural} you will complete at a time. e.g: if you enter 3, you will only work in multiples of 3 (6 ${plural}, 9 ${plural}, 15 ${plural}, etc)`)
        if (["minute", "hour"].includes(singular.toLowerCase())) {
            $("label[for='id_y']").text(`How Long will this Assignment Take to Complete`);
            $("label[for='id_works']").text(`How Long have you Already Worked`);
            
            $("#id-time_per_unit-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-time_per_unit-field-wrapper").outerHeight()).find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", -1);
            $("#id-y-field-wrapper, #id-works-field-wrapper").addClass("has-widget");

            // Let's make the logic for changing the step size and time per unit for "minute" and "hour" units of work server sided
            // This is to make the form more smooth and less unpredictable (i.e. if you set a step size to some value with 
            // some unit of work, clear the unit of work, and re-enter the same thing, the step size would have changed to
            // 1 or 5 instead of what was originally entered)

            if (singular.toLowerCase() === "minute") {
                $("#id-funct_round-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-funct_round-field-wrapper").outerHeight()).find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", -1);
            } else if (singular.toLowerCase() === "hour") {
                $("#id-funct_round-field-wrapper").removeClass("hide-field").css("margin-top", "").find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
            }
        } else {
            $("label[for='id_y']").text(`Total number of ${plural} in this Assignment`);
            $("label[for='id_time_per_unit']").text(`How Long does it Take to complete each ${singular}`);
            $("label[for='id_works']").text(`Total number of ${plural} already Completed`);
            
            $(".hide-field").removeClass("hide-field").css("margin-top", "").find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
            $("#id-y-field-wrapper, #id-works-field-wrapper").removeClass("has-widget");

            if (["minute", "hour"].includes(that.old_unit_value)) {
                $("#id_time_per_unit").val("");
                $("#id_funct_round").val(1);
            }
        }
        that.old_unit_value = singular.toLowerCase();
    }
    setCrudHandlers() {
        const that = this;
        // Create and show a new form when user clicks new assignment
        $("#image-new-container").click(function() {
            Crud.setAssignmentFormFields(Crud.getDefaultAssignmentFormFields());
            $("#new-title").text("New Assignment");
            $("#submit-assignment-button").text("Create Assignment").val('');
            that.showForm();
        });
        // Populate form on edit
        $('.update-button').parent().click(function() {
            const sa = utils.loadAssignmentData($(this));

            if (sa.name === EXAMPLE_ASSIGNMENT_NAME) {
                $.alert({
                    title: "You cannot modify the example assignment",
                    content: "Don't worry, you can modify everything else"
                });
                return;
            }
            $("#new-title").text("Edit Assignment");
            $("#submit-assignment-button").text("Edit Assignment");
            Crud.setAssignmentFormFields(Crud.generateAssignmentFormFields(sa));
            if (sa.needs_more_info) {
                $("#form-wrapper .field-wrapper:not(.hide-field) > :not(label, #due-date-empty, .dont-mark-invalid-if-empty, .info-button)").each(function() {
                    $(this).toggleClass("invalid", !$(this).val());
                });
            }

            // Set button pk so it gets sent on post
            $("#submit-assignment-button").val(sa.id);
            that.showForm();
        });
        $('.delete-button').parent().click(function(e) {
            const $this = $(this);
            if (e.shiftKey) {
                that.deleteAssignment($this);
                return;
            }
            const sa = utils.loadAssignmentData($this);
            $.confirm({
                title: `Are you sure you want to delete assignment "${sa.name}"?`,
                content: 'This action is irreversible.',
                buttons: {
                    confirm: {
                        keys: ['Enter'],
                        action: function() {
                            that.deleteAssignment($this);
                        }
                    },
                    cancel: function() {
                        
                    }
                }
            });
        });

        // Arrow function to preserve this
        $("#form-wrapper #cancel-button").click(() => that.hideForm());
        $("#form-wrapper #field-group-picker").click(Crud.RESET_FORM_GROUP_MARGINS);
        $("#id_unit, #y-widget-checkbox").on('input', () => that.replaceUnit());
        $("#id_unit").on('input', Crud.RESET_FORM_GROUP_MARGINS);
        
        $("#fields-wrapper").find(Crud.ALL_FOCUSABLE_FORM_INPUTS).on('focus', e => {
            const new_parent = $(e.target).parents(".field-group");
            const old_parent = $(e.relatedTarget).parents(".field-group");
            if (!new_parent.is(old_parent) && old_parent.length && new_parent.length)
                Crud.GO_TO_FIELD_GROUP({ toggle: true });
        });

        $(".field-widget-checkbox").on('input', function() {
            let widget_input = $(this).prevAll("input:not([id^=\"initial\"]):first");
            if (!widget_input.val()) return;
            if ($(this).is(":checked")) {
                widget_input.val(Math.round(
                    widget_input.val() / 60
                * 100) / 100);
            } else {
                widget_input.val(Math.round(widget_input.val() * 60));
            }
        });
        $("#id_description").expandableTextareaHeight();
        // Sets custom error message
        $("#id_name").on("input invalid",function(e) {
            if (utils.in_simulation) {
                this.setCustomValidity("You can't add or edit assignments in the simulation; this functionality is not yet supported :(");
            } else {
                Crud.GO_TO_FIELD_GROUP({standard: true})
                this.setCustomValidity(e.type === "invalid" ? 'Please enter an assignment name' : '');
            }
        });
        let alert_already_shown = false;
        $("#id_min_work_time, #id_time_per_unit").on("focusout", () => {
            
            if (!(
                // Criteria for doing this alert

                +$("#id_y").val() === 1 &&
                // <= 1 to alert again if it aleady alerted, meaning funct_round will be set to some number less than 1
                +$("#id_funct_round").val() <= 1 &&
                // + to make sure it isnt empty nor 0, as funct_round is then set to 0 or NaN
                +$("#id_min_work_time").val() &&
                +$("#id_time_per_unit").val() &&
                // Make sure the new funct_round value is less than 1
                +$("#id_time_per_unit").val() > +$("#id_min_work_time").val() &&
                !alert_already_shown
            )) return;
            const original_funct_round = +$("#id_funct_round").val();
            // funct_round * time_per_unit * y = min_work_time
            // funct_round * time_per_unit = min_work_time
            // funct_round = min_work_time / time_per_unit
            $("#id_funct_round").val(
                Math.max(Crud.STEP_SIZE_AUTO_LOWER_ROUND, // Don't want this to round to 0
                    mathUtils.precisionRound(
                        Crud.STEP_SIZE_AUTO_LOWER_ROUND * Math.round(
                            $("#id_min_work_time").val() / $("#id_time_per_unit").val()
                            / Crud.STEP_SIZE_AUTO_LOWER_ROUND
                        )
                    , 10)
                )
            );

            $.alert({
                title: `This assignment's step size has been automatically changed from ${original_funct_round} to ${$("#id_funct_round").val()}`,
                content: "This helps prevent you from unnecessarily working longer than your minimum work time and ensures a smoother work schedule. The step size can be edited and overridden in the advanced inputs.",
                onClose: function() {
                    alert_already_shown = true;
                }
            })
        });

        let submitted = false;
        $("#form-wrapper form").submit(function(e) {
            window.disable_loading = true;
            // Prevent submit button spam clicking
            if (submitted) {
                e.preventDefault();
                return;
            }
            submitted = true;
            // Enable disabled field on submit so it's sent with post
            $("#id_time_per_unit, #id_funct_round").removeAttr("disabled");
            // JSON fields are picky with their number inputs, convert them to standard form
            $("#id_works").val() && $("#id_works").val(+$("#id_works").val());
            $("#submit-assignment-button").text("Submitting...");
        });
    }
    addInfoButtons() {
        $("#id_unit").info('left',
            `This is how your assignment will be split and divided up
            
            e.g: If this assignment is reading a book, enter "Page" or "Chapter"`, 
        "after").css({
            marginTop: -22,
            marginLeft: "auto",
            marginRight: 7,
        });
        $("#id_funct_round").info('left',
            "e.g: if you enter 3, you will only work in multiples of 3 (6 units, 9 units, 15 units, etc)",
        "after").css({
            marginTop: -22,
            marginLeft: "auto",
            marginRight: 7,
        });
        $("label[for=\"id_soft\"]").info('left',
            `Soft due dates are automatically incremented if you haven't finished the assignment by then`,
        "append").css({
            marginLeft: 4,
        });
    }
    // Delete assignment
    transitionDeleteAssignment(dom_assignment) {
        const that = this;
        const sa = utils.loadAssignmentData(dom_assignment);

        // Make overflow hidden because trying transitioning margin bottom off the screen still allows it to be scrolled to
        // $("#assignments-container").css("overflow", "hidden"); (unhide this in the callback if this is added back)
        // NOTE: removed because of bugginess and just looking bad overall

        // Opacity CSS transition
        dom_assignment.css({
            opacity: "0",
            zIndex: dom_assignment.css("z-index")-2,
        });
        const assignment_container = dom_assignment.parents(".assignment-container");
        // Use css transitions because the animate property on assignment_container is reserved for other things in priority.js
        assignment_container.animate({marginBottom: -(dom_assignment.height() + parseFloat(assignment_container.css("padding-top")) + parseFloat(assignment_container.css("padding-bottom")))}, Crud.DELETE_ASSIGNMENT_TRANSITION_DURATION, "easeOutCubic", function() {
            dat = dat.filter(_sa => sa.id !== _sa.id);
            // If a shorcut is in assignment_container, take it out so it doesn't get deleted
            assignment_container.children("#delete-starred-assignments, #autofill-work-done").insertBefore(assignment_container);
            assignment_container.remove();
            // If you don't include this, drawFixed in graph.js when $(window).trigger() is run is priority.js runs and causes an infinite loop because the canvas doesn't exist (because it was removed in the previous line)
            dom_assignment.removeClass("assignment-is-closing open-assignment");
            // Although nothing needs to be swapped, new Priority().sort() still needs to be run to recolor and prioritize assignments and place shortcuts accordingly
            new Priority().sort();
        });
    }
    deleteAssignment($button) {
        const that = this;
        // Unfocus to prevent pressing enter to click again
        $button.blur();
        const dom_assignment = $button.parents(".assignment");
        if (dom_assignment.hasClass("assignment-is-deleting")) return;
        dom_assignment.addClass("assignment-is-deleting");
        // Send data to backend and animates its deletion
        const success = function() {
            that.transitionDeleteAssignment(dom_assignment);
        }
        if (ajaxUtils.disable_ajax) {
            success();
            return;
        }
        const sa = utils.loadAssignmentData($button);
        $.ajax({
            type: "DELETE",
            url: "/api/delete-assignment",
            data: {assignments: [sa.id]},
            success: success,
            error: function() {
                dom_assignment.removeClass("assignment-is-deleting");
                ajaxUtils.error(...arguments);
            }
        });
    }
}
$(window).one("load", function() {
    new Crud().init();
});