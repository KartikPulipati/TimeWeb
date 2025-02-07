class Crud {
    static getDefaultAssignmentFormFields = _ => ({
        "#id_name": '',
        "#id_assignment_date_daterangepicker": utils.formatting.stringifyDate(date_now),
        "#id_x_daterangepicker": moment(new Date(date_now.valueOf())),
        "#id_x": "",
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
            const field_is_daterangepicker = field.endsWith("_daterangepicker");
            if (field_is_daterangepicker) field = field.replace("_daterangepicker", "");
            const $field = $(field);

            if (field === "#id_break_days") continue;
            if (field === "#id_unit") {
                const normalized_value = pluralize(value, 1).toLowerCase();
                if (normalized_value === "minute") {
                    $("#y-widget-checkbox").prop("checked", false);
                    $field.val("");
                    continue;
                } else if (normalized_value === "hour") {
                    $("#y-widget-checkbox").prop("checked", true);
                    $field.val("");
                    continue;
                }
            }

            if ($field.attr("type") === "checkbox")
                $field.prop("checked", value);
            else if (field_is_daterangepicker && 
                // ensure it doesn't display "Invalid date"
                value !== "") {
                $field.data("daterangepicker").setStartDate(value);
                $field.data("daterangepicker").setEndDate(value);
            } else
                $field.val(value);
        }
        for (let break_day of Array(7).keys()) {
            // (break_day+6)%7) is for an ordering issue, ignore that
            // Treat this as $("#id_def_break_days_"+break_day)
            $(`#id_def_break_days_${(break_day+6) % 7}`).prop("checked", formDict["#id_break_days"].includes(break_day));
        }
    }
    static DEFAULT_DATERANGEPICKER_OPTIONS = {
        buttonClasses: "generic-button",
        parentEl: "main",
        showDropdowns: true,
        singleDatePicker: true,
    }
    static ALL_FOCUSABLE_FORM_INPUTS = (function() {
        // use DOMContentLoaded instead of $(function() { so it is defined soon enough for showForm({params: show_instantly})
        document.addEventListener("DOMContentLoaded", function() {
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
    static SHORTCUT_DELETION_ANIMATION_THRESHOLD = 15

    // it is important to use .click instead of .prop("checked", true/false) so the animation click handler fires
    static STANDARD_FIELD_GROUP = () => {
        if ($("#form-wrapper #field-group-picker-checkbox").is(":checked")) {
            $("#form-wrapper #field-group-picker").click();
        }
    }
    static ADVANCED_FIELD_GROUP = () => {
        if (!$("#form-wrapper #field-group-picker-checkbox").is(":checked")) {
            $("#form-wrapper #field-group-picker").click();
        }
    }
    static TOGGLE_FIELD_GROUP = () => $("#form-wrapper #field-group-picker").click()
    static GO_TO_FIELD_GROUP = params => {
        if (params.standard) {
            Crud.STANDARD_FIELD_GROUP();
        } else if (params.advanced) {
            Crud.TOGGLE_FIELD_GROUP();
        } else if (params.toggle) {
            Crud.TOGGLE_FIELD_GROUP();
        } else if (params.$dom_group) {
            assert(params.$dom_group.hasClass("field-group"));
            switch (params.$dom_group.attr("id")) {
                case "first-field-group":
                    Crud.STANDARD_FIELD_GROUP();
                    break;

                case "second-field-group":
                    Crud.ADVANCED_FIELD_GROUP();
                    break;
            }
        }
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
            picker.container.css("transform", `translateX(${$("#form-wrapper #fields-wrapper").css("--magic-wand-width").trim()})`);
        }).on('cancel.daterangepicker', function(e, picker) {
            $(this).val(old_due_date_val);
        }).on('apply.daterangepicker', function(e, picker) {
            if (6 <= picker.startDate.hours() && picker.startDate.hours() <= 11)
            $.alert({
                title: "Your due time is early.",
                content: "For an assignment due in the morning, TimeWeb assigns work past midnight on the day it is due. To avoid this, set the due time to midnight (i.e. before you sleep)",
                backgroundDismiss: false,
                buttons: {
                    ignore: function() {
                        
                    },
                    "Set to your sleep time": {
                        action: function() {
                            $("#id_x").click();
                        },
                    },
                    "Set to midnight": {
                        action: function() {
                            picker.setStartDate(picker.startDate.startOf("day"));
                        },
                    },
                },
            });
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
        if (params.show_instantly) {
            $('#overlay').show().find("#form-wrapper").css("top", Crud.FORM_POSITION_TOP);
            // cursed way to position magic wand icon
            // TODO: ideally i want a span wrapper around input so i dont have to consult the dark arts to position the magic wand icon
            $(".magic-wand-icon").each(function() {
                const field_wrapper = $(this).parents(".field-wrapper");
                const error_note = field_wrapper.find(".assignment-form-error-note");

                // the class is just to determine whether or not the field was previously predicted
                if (field_wrapper.hasClass("disabled-field")) {
                    field_wrapper.removeClass("disabled-field");
                    field_wrapper.find(".magic-wand-icon").click();
                }

                if (!error_note.length) return;
                // ew
                $(this).css("margin-bottom", error_note.height());
            });
        } else {
            $(".magic-wand-icon").css("margin-bottom", "");
            $("#overlay").fadeIn(Crud.FORM_ANIMATION_DURATION).find("#form-wrapper").animate({top: Crud.FORM_POSITION_TOP}, Crud.FORM_ANIMATION_DURATION);
            $("form input:visible").first().focus();
            $(".field-wrapper.disabled-field").each(function() {
                $(this).find(".magic-wand-icon").click();
            });
        }
        Crud.one_unit_of_work_alert_already_shown = false;
        that.old_unit_value = undefined;
        that.replaceUnit();

        setTimeout(function() {
            $("#id_description").trigger("input");
            if ($("#form-wrapper #second-field-group .invalid").length) {
                Crud.GO_TO_FIELD_GROUP({advanced: true});
            }
        }, 0);
    }
    hideForm(params={hide_instantly: false}) {
        const that = this;

        if (params.hide_instantly) {
            $("#overlay").hide().find("#form-wrapper");
            $(".assignment-form-error-note").remove(); // Remove all error notes when form is exited
        } else {
            $("#overlay").fadeOut(Crud.FORM_ANIMATION_DURATION, function() {
                // Remove all error notes when form is exited
                $(".invalid").removeClass("invalid");
                $(".assignment-form-error-note").remove();
                Crud.GO_TO_FIELD_GROUP({standard: true});
                // You may stll be focused on an <input> when the form is hidden, invalidating keybinds
                $(document.activeElement).blur();
            }).find("#form-wrapper").animate({top: 0}, Crud.FORM_ANIMATION_DURATION);
        }
    }
    replaceUnit() {
        const that = this;

        if (that.replaceUnit.is_currently_running) {
            that.replaceUnit.recurse = true;
        } else {
            that.replaceUnit.is_currently_running = true;
            that.replaceUnitWithoutTimeout();
            // If replaceUnitWithoutTimeout is run very quickly, it is possible for it to run the unit is of time branch
            // while the setTimeout underneath still hasn't ran
            // Queue up a recursion if that happens

            // setTimout to run after the setTimeout in replaceUnitWithoutTimeout is done
            setTimeout(function() {
                if (that.replaceUnit.recurse) {
                    that.replaceUnit.recurse = false;
                    that.replaceUnit.is_currently_running = false;
                    that.replaceUnit();
                } else {
                    that.replaceUnit.is_currently_running = false;
                }
            }, 0);
        }
    }
    replaceUnitWithoutTimeout() {
        const that = this;

        // Can't directly juse .slice() it because safari returns the psuedo's content without quotes
        let val = $("#id_unit").val().trim() || $("#id_y ~ .field-widget").getPseudoStyle("::after", "content");
        if (val.substring(0, 1) === "\"" && val.substring(val.length - 1) === "\"")
            val = val.slice(1, -1);
        let plural = pluralize(val),
            singular = pluralize(val, 1);
        $("label[for='id_funct_round'] ~ .info-button .info-button-text").text(`This is the number of ${plural} you will complete at a time
        
        i.e. if you enter 3, you will only work in multiples of 3 (6 ${plural}, 9 ${plural}, 15 ${plural}, etc)`)
        if (["minute", "hour"].includes(singular.toLowerCase())) {
            $("label[for='id_works']").text(`How long have you already worked`);

            if (that.old_unit_value === undefined) {
                // Appropiately place #id_y when the form is initially loaded and shown
                // Simulates the state of #id-y-field-wrapper after transitionend
                $("#id-y-field-wrapper")
                    .insertAfter($("#id-x-field-wrapper"))
                    .removeClass("hide-field").css("margin-top", "")
                    .addClass("has-widget")
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
                $("label[for='id_y']").text(`How long will this assignment take to complete`);
            } else if (!["minute", "hour"].includes(that.old_unit_value)) {
                $("#id-y-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-y-field-wrapper").outerHeight())
                    .on("transitionend", function(e) {
                        if (e.originalEvent !== undefined // for .trigger
                            && e.originalEvent.propertyName !== "margin-top") return;

                        $(this).off("transitionend")
                            .removeClass("hide-field").css("margin-top", "")
                            .insertAfter($("#id-x-field-wrapper"))
                            .addClass("has-widget")
                            .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
                        // Don't immediately change text back to how #id_y initially looks like to make it seemless
                        $("label[for='id_y']").text(`How long will this assignment take to complete`);
                    })
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", -1);
                // don't change the step size nor time per unit here, read the below comment
            } else {
                // Normal text change if there's nothing to do with #id_y
                $("label[for='id_y']").text(`How long will this assignment take to complete`);
                $("#id-y-field-wrapper").addClass("has-widget");
            }
            $("#id-time_per_unit-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-time_per_unit-field-wrapper").outerHeight())
                .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", -1);
            $("#id-works-field-wrapper").addClass("has-widget");

            // Let's make the logic for changing the step size and time per unit for "minute" and "hour" units of work server sided
            // This is to make the form more smooth and less unpredictable (i.e. if you set a step size to some value with 
            // some unit of work, clear the unit of work, and re-enter the same thing, the step size would have changed to
            // 1 or 5 instead of what was originally entered)

            if (singular.toLowerCase() === "minute") {
                $("#id-funct_round-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-funct_round-field-wrapper").outerHeight())
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", -1);
            } else if (singular.toLowerCase() === "hour") {
                $("#id-funct_round-field-wrapper").removeClass("hide-field").css("margin-top", "")
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
            }
        } else {
            // Make sure this is ran before the .text because this can affect #id_y's text
            $("#id-y-field-wrapper").trigger("transitionend").off("transitionend");

            $("label[for='id_y']").text(`Total number of ${plural} in this assignment`);
            $("label[for='id_time_per_unit']").text(`How long does it take to complete each ${singular}`);
            $("label[for='id_works']").text(`Total number of ${plural} already completed`);

            setTimeout(function() {
                $(".hide-field").removeClass("hide-field").css("margin-top", "")
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
            }, 0);
            $("#id-y-field-wrapper, #id-works-field-wrapper").removeClass("has-widget");

            if (that.old_unit_value === undefined) {
                // Appropiately place #id_y when the form is initially loaded and shown
                // Simulates the state of #id-y-field-wrapper after the .hide-field setTimeout
                $("#id-y-field-wrapper")
                    .insertAfter($("#id-unit-field-wrapper"))
                    .find(Crud.ALL_FOCUSABLE_FORM_INPUTS).attr("tabindex", "");
            } else if (["minute", "hour"].includes(that.old_unit_value)) {
                $("#id-y-field-wrapper").addClass("hide-field").css("margin-top", -$("#id-y-field-wrapper").outerHeight())
                    .insertAfter($("#id-unit-field-wrapper"));
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
                    title: "You cannot modify the example assignment.",
                    content: "Don't worry, you can modify everything else."
                });
                return;
            }
            $("#new-title").text("Edit Assignment");
            $("#submit-assignment-button").text("Edit Assignment");
            Crud.setAssignmentFormFields(Crud.generateAssignmentFormFields(sa));
            if (sa.needs_more_info) {
                $("#form-wrapper .field-wrapper:not(.hide-field) > :not(label, .magic-wand-icon, .dont-mark-invalid-if-empty, .info-button)").each(function() {
                    $(this).toggleClass("invalid", !$(this).val());
                });
            }

            // Set button pk so it gets sent on post
            $("#submit-assignment-button").val(sa.id);
            that.showForm();
        });
        $('.delete-button, .restore-button').parent().click(function(e) {
            const $this = $(this);
            // shift + d while in the close assignment transition bugs it
            // use transitionend to run this
            new Promise(function(resolve) {
                const dom_assignment = $this.parents(".assignment");
                if (dom_assignment.hasClass("assignment-is-closing")) {
                    dom_assignment.find(".assignment-footer").one("transitionend", resolve);
                } else {
                    resolve();
                }
            }).then(function() {
                if ($this.children(".delete-button").length) {
                    if (e.shiftKey) {
                        that.deleteAssignment($this);
                        return;
                    }
                    const sa = utils.loadAssignmentData($this);
                    $.confirm({
                        title: `Are you sure you want to delete assignment "${sa.name}"?`,
                        content: utils.formatting.getReversibilityStatus(),
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
                } else if ($this.children(".restore-button").length) {
                    that.deleteAssignment($this, {restore: true});
                }
            });
        });

        // Arrow function to preserve this
        $("#form-wrapper #cancel-button").click(() => that.hideForm());
        $("#form-wrapper #field-group-picker").click(() => {
            $("#first-field-group, #second-field-group").trigger("transitionend");
            let second_minus_first = $("#form-wrapper #second-field-group .instant-margin-transition")[0].scrollHeight - $("#form-wrapper #first-field-group .instant-margin-transition")[0].scrollHeight;
            if ($("#form-wrapper #field-group-picker-checkbox").is(":checked")) {
                $("#first-field-group").css("margin-bottom", -second_minus_first).one("transitionend", function() {
                    $("#first-field-group").addClass("notransition");
                    $("#first-field-group").css("margin-bottom", "");
                    $("#first-field-group")[0].offsetHeight;
                    $("#first-field-group").removeClass("notransition");
                    $("#first-field-group .instant-margin-transition").css("margin-bottom", "");
                });
                $("#first-field-group .instant-margin-transition").css("margin-bottom", second_minus_first);
            } else {
                $("#second-field-group").css("margin-bottom", second_minus_first).one("transitionend", function() {
                    $("#second-field-group").addClass("notransition");
                    $("#second-field-group").css("margin-bottom", "");
                    $("#second-field-group")[0].offsetHeight;
                    $("#second-field-group").removeClass("notransition");
                    $("#second-field-group .instant-margin-transition").css("margin-bottom", "");
                });
                $("#second-field-group .instant-margin-transition").css("margin-bottom", -second_minus_first);
            }
        });
        $("#id_unit, #y-widget-checkbox").on('input', () => that.replaceUnit());
        let recursion_stopper = false;
        $(".magic-wand-icon").click(function() {
            if ($(".disabled-field .magic-wand-icon").not($(this)).length === 1 && !recursion_stopper) {
                recursion_stopper = true;
                $(".disabled-field .magic-wand-icon").not($(this)).click();
            }
            recursion_stopper = false;
            const field_wrapper = $(this).parents(".field-wrapper");
            const field_wrapper_input = field_wrapper.find(Crud.ALL_FOCUSABLE_FORM_INPUTS).not(".field-widget-checkbox");
            field_wrapper.toggleClass("disabled-field");

            if (field_wrapper.attr("original-type") === undefined)
                field_wrapper.attr("original-type", field_wrapper_input.attr("type"));
            field_wrapper_input.attr("type", field_wrapper.hasClass("disabled-field") ? "text" : field_wrapper.attr("original-type"));
            field_wrapper_input.prop("disabled", field_wrapper.hasClass("disabled-field")).val(field_wrapper.hasClass("disabled-field") ? "Predicted" : "");
        });
        let preventRecursion;
        $("#fields-wrapper").find(Crud.ALL_FOCUSABLE_FORM_INPUTS).on('focus', e => {
            if (preventRecursion) {
                preventRecursion = false;
                return;
            }
            const new_parent = $(e.target).parents(".field-group");
            const old_parent = $(e.relatedTarget).parents(".field-group");
            if (!new_parent.is(old_parent) && old_parent.length && new_parent.length
                // Prevent infinite recursion
                && e.relatedTarget !== undefined && e.relatedTarget !== null) {
                if (SETTINGS.animation_speed) {
                    preventRecursion = true;
                    e.relatedTarget.focus();
                    e.relatedTarget.blur();
                }
                Crud.GO_TO_FIELD_GROUP({ $dom_group: new_parent });
                if (SETTINGS.animation_speed) {
                    $("#first-field-group").one("transitionend", function() {
                        preventRecursion = true;
                        e.target.focus();
                        $(document).off("keypress.fieldgroupanimation");
                    });
                    $(document).one("keypress.fieldgroupanimation", () => $("#first-field-group").trigger("transitionend"));
                }
            // If the user goes to the advanced tab and presses tab after currently being focused on the element before the first
            // input in the standard tab, it will instead focus on that and give focus to a completely invisible element
            // This checks for when that happens and appropriately gives focus to the correct element

            // new_parent.is("#first-field-group") instead of new_parent.length because a click event is too similar to a tabbing event
            // this detects a tabbing event only
            } else if (new_parent.is("#first-field-group") && !old_parent.length && $("#form-wrapper #field-group-picker-checkbox").is(":checked")) {
                // Doesn't work because #id_y is first in Crud.ALL_FOCUSABLE_FORM_INPUTS and can cause that to be focused instead
                // $("#second-field-group").find(Crud.ALL_FOCUSABLE_FORM_INPUTS).first().focus();

                preventRecursion = true;
                $("#second-field-group .field-wrapper").first().find(Crud.ALL_FOCUSABLE_FORM_INPUTS).focus();
            }
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
        Crud.one_unit_of_work_alert_already_shown = false;
        $("#id_y, #id_funct_round, #id_min_work_time, #id_time_per_unit").on("focusout", () => {
            
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
                !Crud.one_unit_of_work_alert_already_shown
            )) return;

            $.alert({
                title: "This assignment is <b>strongly not recommended</b> to be created with only one unit of work in this manner.",
                content: "Please consider splitting up your assignment into either 1) smaller and more plentiful units of work or 2) units of time, by clearing the name of each unit of work field.",
                onClose: function() {
                    Crud.one_unit_of_work_alert_already_shown = true;
                }
            })
        });

        $("#submit-assignment-button").click(function(e) {
            // Custom error messages
            if (utils.in_simulation) {
                Crud.GO_TO_FIELD_GROUP({$dom_group: $("#form-wrapper form #first-field-group input:visible:first").parents(".field-group")});
                $("#form-wrapper form #first-field-group input:visible:first")[0].setCustomValidity("You can't add or edit assignments in the simulation. This functionality is not yet supported :(");
                return;
            }
            if ($("#id_name").is(":invalid")) {
                Crud.GO_TO_FIELD_GROUP({$dom_group: $("#id_name").parents(".field-group")});
                $("#id_name")[0].setCustomValidity("Please enter an assignment name");
                return;
            }
            if ($("#id-x-field-wrapper.disabled-field").length) {
                if ($("#id_y").val() === "") {
                    Crud.GO_TO_FIELD_GROUP({$dom_group: $("#id_y").parents(".field-group")});
                    $("#id_y")[0].setCustomValidity("Please enter a value for the due date prediction");
                    return;
                }
            } else if ($("#id-y-field-wrapper.disabled-field").length) {
                if ($("#id_x").val() === "") {
                    Crud.GO_TO_FIELD_GROUP({$dom_group: $("#id_x").parents(".field-group")});
                    // daterangepicker sometimes doesn't open when initially in advanced inputs but idc
                    $("#id_x")[0].setCustomValidity("Please enter a value for the other field's prediction");
                    // gets in the way of daterangepicker
                    setTimeout(() => {
                        $("#id_x")[0].setCustomValidity("");
                    }, 2500);
                    return;
                }
            }
        });
        $("#form-wrapper form input").on("input invalid", function(e) {
            // Clear the custom validation message and don't make it show up again for every input
            if (e.type === "input") {
                this.setCustomValidity("");
            }
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
        $("#next-page").click(function() {
            const url = new URL(window.location.href);
            url.searchParams.set('everything_before', $(".assignment").length ? utils.loadAssignmentData($(".assignment").last()).id : Crud.last_removed_id);
            url.searchParams.delete('everything_after');
            window.location.href = url.href;
        });
        $("#previous-page").click(function() {
            const url = new URL(window.location.href);
            url.searchParams.set('everything_after', $(".assignment").length ? utils.loadAssignmentData($(".assignment").first()).id : Crud.last_removed_id);
            url.searchParams.delete('everything_before');
            window.location.href = url.href;
        });
        if ($("#next-page").length || $("#previous-page").length) {
            $("#no-assignments-message").text("You don't have any deleted assignments on this page...")
        }
    }
    addInfoButtons() {
        $("#id_unit").info('left',
            `This is how your assignment will be split and divided up
            
            i.e. If this assignment is reading a book, enter "Page" or "Chapter"`, 
        "after").css({
            marginTop: -22,
            marginLeft: "auto",
            marginRight: 7,
        });
        $("#id_funct_round").info('left',
            "", // overridden in replaceUnit
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
    transitionDeleteAssignment($dom_assignment) {
        const that = this;
        const ids = new Set();
        $dom_assignment.each(function(i) {
            const dom_assignment = $(this);
            const assignment_container = dom_assignment.parents(".assignment-container");
            const sa = utils.loadAssignmentData(dom_assignment);

            // Make overflow hidden because trying transitioning margin bottom off the screen still allows it to be scrolled to
            // $("#assignments-container").css("overflow", "hidden"); (unhide this in the callback if this is added back)
            // NOTE: removed because of bugginess and just looking bad overall
            function transition_callback() {
                // If a shorcut is in assignment_container, take it out so it doesn't get deleted
                assignment_container.find("#delete-starred-assignments, #autofill-work-done").insertBefore(assignment_container);
                assignment_container.remove();
                Crud.last_removed_id = sa.id;
                // If you don't include this, drawFixed in graph.js when $(window).trigger() is run is priority.js runs and causes an infinite loop because the canvas doesn't exist (because it was removed in the previous line)
                dom_assignment.removeClass("assignment-is-closing open-assignment");

                ids.add(sa.id);
                if (i === $dom_assignment.length - 1) {
                    dat = dat.filter(sa => !ids.has(sa.id));
                    // Although nothing needs to be swapped, new Priority().sort() still needs to be run to recolor and prioritize assignments and place shortcuts accordingly
                    new Priority().sort({ dont_swap: true });
                }
            }
            
            if ($dom_assignment.length > Crud.SHORTCUT_DELETION_ANIMATION_THRESHOLD) {
                transition_callback();
            } else {
                // Opacity CSS transition
                dom_assignment.css({
                    opacity: "0",
                    zIndex: dom_assignment.css("z-index")-2,
                });
                // Use css transitions because the animate property on assignment_container is reserved for other things in priority.js
                assignment_container.animate({marginBottom: -(dom_assignment.height() + parseFloat(assignment_container.css("padding-top")) + parseFloat(assignment_container.css("padding-bottom")))}, 
                    Crud.DELETE_ASSIGNMENT_TRANSITION_DURATION, "easeOutCubic", transition_callback);
            }
        });
    }
    deleteAssignment($button, params={restore: false}) {
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
        if (params.restore)
            $.ajax({
                type: "PATCH",
                url: "/api/restore-assignment",
                data: {assignments: [sa.id]},
                success: success,
                error: function() {
                    dom_assignment.removeClass("assignment-is-deleting");
                    ajaxUtils.error.bind(this)(...arguments);
                }
            });
        else
            // don't batch this so assignment-is-deleting is instantly removed
            $.ajax({
                type: "POST",
                url: "/api/delete-assignment",
                data: {assignments: [sa.id], actually_delete: VIEWING_DELETED_ASSIGNMENTS},
                success: success,
                error: function() {
                    dom_assignment.removeClass("assignment-is-deleting");
                    ajaxUtils.error.bind(this)(...arguments);
                }
            });
    }
}
$(window).one("load", function() {
    new Crud().init();
});