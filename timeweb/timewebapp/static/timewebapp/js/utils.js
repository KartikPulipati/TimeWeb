utils = {
    formatting: {
        stringifyDate: function(date) {
            if (!date instanceof Date) return "";
            return [
                ('0' + (date.getMonth() + 1)).slice(-2),
                ('0' + date.getDate()).slice(-2),
                ('000' + date.getFullYear()).slice(-4),
            ].join('/');
        },
        formatMinutes: function(total_minutes) {
            const hour = Math.floor(total_minutes / 60),
                minute = Math.ceil(total_minutes % 60);
            if (!hour) return (total_minutes && total_minutes < 1) ? "<1m" : minute + "m";
            if (!minute) return hour + "h";
            return hour + "h " + minute + "m";
        },
        // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
        hexToRGB: function(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
        },
        // https://www.geeksforgeeks.org/program-change-rgb-color-model-hsv-color-model/
        rgbToHSV: function(r , g , b) {
 
            // R, G, B values are divided by 255
            // to change the range from 0..255 to 0..1
            r = r / 255.0;
            g = g / 255.0;
            b = b / 255.0;
     
            // h, s, v = hue, saturation, value
            var cmax = Math.max(r, Math.max(g, b)); // maximum of r, g, b
            var cmin = Math.min(r, Math.min(g, b)); // minimum of r, g, b
            var diff = cmax - cmin; // diff of cmax and cmin.
            var h = -1, s = -1;
     
            // if cmax and cmax are equal then h = 0
            if (cmax == cmin)
                h = 0;
     
            // if cmax equal r then compute h
            else if (cmax == r)
                h = (60 * ((g - b) / diff) + 360) % 360;
     
            // if cmax equal g then compute h
            else if (cmax == g)
                h = (60 * ((b - r) / diff) + 120) % 360;
     
            // if cmax equal b then compute h
            else if (cmax == b)
                h = (60 * ((r - g) / diff) + 240) % 360;
     
            // if cmax equal zero
            if (cmax == 0)
                s = 0;
            else
                s = (diff / cmax) * 100;
     
            // compute v
            var v = cmax * 100;
            return {h, s, v};
        },
        // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
        hsvToRGB: function(h, s, v) {
            h /= 360;
            s /= 100;
            v /= 100;

            var r, g, b, i, f, p, q, t;
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v, g = t, b = p; break;
                case 1: r = q, g = v, b = p; break;
                case 2: r = p, g = v, b = t; break;
                case 3: r = p, g = q, b = v; break;
                case 4: r = t, g = p, b = v; break;
                case 5: r = v, g = p, b = q; break;
            }
            return {r: r*255, g: g*255, b: b*255};
        },
        RGBToString(color, params={ invert: false }) {
            if (params.invert)
                return `rgb(
                    ${255 - color.r},
                    ${255 - color.g},
                    ${255 - color.b}
                )`.replace(/\s+/g, '');
            else
                return `rgb(
                    ${color.r},
                    ${color.g},
                    ${color.b}
                )`.replace(/\s+/g, '');
        },
        arrayToEnglish: function(array) {
            return `<ul><li>${array.join("</li><li>")}</li></ul>`;
        },
        getReversibilityStatus: () => utils.in_simulation ? "This action can be reversed by refreshing this page." : "This action is irreversible.",
    },
    ui: {
        tickClock: function() {
            const now = utils.getRawDateNow();
            const estimated_completion_time = new Date(now.valueOf());
            const minute_value = estimated_completion_time.getMinutes();

            estimated_completion_time.setMinutes(minute_value + +$("#estimated-total-time").attr("data-minutes"));
            if (isNaN(estimated_completion_time.getMinutes())) {
                estimated_completion_time.setTime(8640000000000000);
            }
            let str = estimated_completion_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // https://stackoverflow.com/questions/42879023/remove-leading-zeros-from-time-format
            str = str.replace(/^[0:]+(?=\d[\d:]{3})/,"");
            $("#estimated-completion-time").text(` (${str})`);
            utils.ui.old_minute_value = minute_value;

            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            if (midnight.valueOf() !== date_now.valueOf()) {
                if (utils.in_simulation || isExampleAccount) return;
                reloadWhenAppropriate();
            }
        },
        setClickHandlers: {
            tickButtons: function() {
                $(".tick-button").parent().click(function() {
                    const $this = $(this);
                    const dom_assignment = $this.parents(".assignment");

                    // .sort is already called in the controls' click handlers
                    const old_enable_tutoral = SETTINGS.enable_tutorial;
                    SETTINGS.enable_tutorial = false;

                    if (!dom_assignment.hasClass("has-been-clicked")) {
                        new VisualAssignment(dom_assignment).initUI();
                    }

                    if ($this.hasClass("slashed")) {
                        dom_assignment.find(".delete-work-input-button").click();
                    } else {
                        dom_assignment.find(".work-input-textbox").val("fin");
                        dom_assignment.find(".submit-work-button").click();
                        // THe "Close graph after work input" setting handles all of this ux for us
                        // if (dom_assignment.hasClass('open-assignment') && $this.hasClass("slashed")) {
                        //     dom_assignment.click();
                        // }
                    }
                    SETTINGS.enable_tutorial = old_enable_tutoral;
                });
            },
            assignmentsHeaderUI: function() {
                $("#current-date").text(`Currently: ${date_now.toLocaleDateString("en-US", {month: 'long', day: 'numeric', weekday: 'long'})}`);
                
                // Hide and show estimated completion time
                $("#hide-button").click(function() {
                    if ($(this).text() === "Hide") {
                        $(this).text("Show");
                        $("#estimated-total-time, #estimated-completion-time, #tomorrow-time").addClass("hide-info");
                        localStorage.setItem("hide-button", true);
                    } else {
                        $(this).text("Hide");
                        $("#estimated-total-time, #estimated-completion-time, #tomorrow-time").removeClass("hide-info");
                        localStorage.removeItem("hide-button");
                    }
                });
                if ("hide-button" in localStorage) {
                    $("#hide-button").click();
                }

                $("#go-to-next-day").click(function() {
                    function changeDay() {
                        utils.in_simulation = true;
                        ajaxUtils.disable_ajax = true;
                        date_now.setDate(date_now.getDate() + 1);
                        $(".assignment.mark-as-done").each(function() {
                            $(this).find(".hide-assignment-button").click();
                        });
                        // Hide current time without using display none, as that can be affected by .toggle
                        $("#estimated-completion-time").css({
                            position: "absolute",
                            top: -9999,
                        });
                        $("#current-date").text("Simulated date: " + date_now.toLocaleDateString("en-US", {month: 'long', day: 'numeric', weekday: 'long'}));
                        new Priority().sort();
                    }

                    if (utils.in_simulation) {
                        changeDay();
                        return;
                    }
                    $.confirm({
                        title: `Are you sure you want to simulate all of your work for tomorrow?`,
                        content: `NONE of the changes you make in the simulation are saved, and your assignments can be restored by refreshing this page.`,
                        buttons: {
                            confirm: {
                                keys: ['Enter'],
                                action: changeDay,
                            },
                            cancel: function() {
                                
                            }
                        },
                    });

                });
            },

            assignmentSorting: function() {
                $("#id_assignment_sorting").on("change", function() {
                    SETTINGS.assignment_sorting = $(this).val();
                    ajaxUtils.ajaxChangeSetting({setting: "assignment_sorting", value: SETTINGS.assignment_sorting});
                    new Priority().sort();
                });
            },

            googleClassroomAPI: function() {
                $("#toggle-gc-api").click(function() {
                    if (isExampleAccount) {
                        $.alert({
                            title: "You can't enable the Google Classroom integration on the example account.",
                            content: "Please create your own account and try again.",
                        });
                        return;
                    }
                    const $this = $(this);
                    if ($this.hasClass("clicked")) return;
                    $this.addClass("clicked");
                    if ($("#toggle-gc-api").text() === "Enable Google Classroom integration") {
                        $.ajax({
                            type: "POST",
                            url: "/api/gc-auth-enable",
                            error: function(jqXHR) {
                                switch (jqXHR.status) {
                                    case 302:
                                        var reauthorization_url = jqXHR.responseText;
                                        reloadWhenAppropriate({ href: reauthorization_url });
                                        break;

                                    default:
                                        ajaxUtils.error.bind(this)(...arguments);
                                }
                            },
                        });
                    } else if ($("#toggle-gc-api").text() === "Disable Google Classroom integration") {
                        $.ajax({
                            type: "POST",
                            url: "/api/gc-auth-disable",
                            error: ajaxUtils.error,
                            success: function(response, textStatus, jqXHR) {
                                switch (jqXHR.status) {
                                    case 204:
                                        $("#toggle-gc-api").text("Enable Google Classroom integration");
                                        $this.removeClass("clicked");
                                        break;
                                }
                            },
                        });
                    }
                });
                if (GC_API_INIT_FAILED) {
                    $.alert({
                        title: "Could not enable the Google Classroom integration.",
                        content: "Authentication failed. Please try again.",
                        backgroundDismiss: false,
                        buttons: {
                            ok: {
    
                            },
                            "try again": {
                                action: () => {
                                    $("#toggle-gc-api").click();
                                },
                            },
                        },
                    });  
                }
            },

            deleteAllStarredAssignments: function() {
                $("#delete-starred-assignments .generic-button").click(function() {
                    $.confirm({
                        title: `Are you sure you want to delete ${$(".finished").length} starred ${pluralize("assignment", $(".finished").length)}?`,
                        content: utils.formatting.getReversibilityStatus(),
                        buttons: {
                            confirm: {
                                keys: ['Enter'],
                                action: function() {
                                    const assignment_ids_to_delete = $(".assignment-container.finished").map(function() {
                                        const dom_assignment = $(this).children(".assignment");
                                        const _sa = utils.loadAssignmentData(dom_assignment);
                                        return _sa.id;
                                    }).toArray();
                                    const success = function() {
                                        const assignments_to_delete = $(".finished");
                                        assignments_to_delete.each(function() {
                                            new Crud().transitionDeleteAssignment($(this).children(".assignment"));
                                        }); 
                                    }
                                    if (ajaxUtils.disable_ajax) {
                                        success();
                                        return;
                                    }
                                    $.ajax({
                                        type: "DELETE",
                                        url: "/api/delete-assignment",
                                        data: {assignments: assignment_ids_to_delete},
                                        success: success,
                                        error: ajaxUtils.error,
                                    });
                                }
                            },
                            cancel: function() {
                                
                            }
                        }
                    });
                });
            },

            autofillWorkDone: function() {
                $("#autofill-work-done .generic-button").click(function(e) {
                    $.confirm({
                        title: `Are you sure you want to autofill ${$("#autofill-selection").val().toLowerCase()} work done?`,
                        content: (function() {
                            switch ($("#autofill-selection").val()) {
                                case "No":
                                    return "Assumes you haven't done anything since your last work input and autofills in no work done until today";
                                case "All":
                                    return "Assumes you followed your work schedule since your last work input and autofills in all work done until today";
                            }
                        })(),
                        buttons: {
                            confirm: {
                                keys: ['Enter'],
                                action: function() {
                                    const params = {};
                                    params[`autofill_${$("#autofill-selection").val().toLowerCase()}_work_done`] = true;
                                    new Priority().sort(params);
                                }
                            },
                            cancel: function() {
                                
                            }
                        }
                    });
                });
            },

            deleteAssignmentsFromClass: function() {
                $(document).click(function(e) {
                    let $this = $(e.target);
                    if (!($this.hasClass("generic-button") && $this.parents(".delete-gc-assignments-from-class").length)) return;
                    const assignment_container = $this.parents(".assignment-container");
                    const dom_assignment = assignment_container.children(".assignment");
                    const sa = utils.loadAssignmentData(dom_assignment);
                    if (assignment_container.hasClass("last-add-line-wrapper")) {
                        var assignments_to_delete = assignment_container;
                    } else {
                        const end_of_line_wrapper = assignment_container.nextAll(".assignment-container.last-add-line-wrapper").first();
                        // Adding a filter to ensure nextUntil doesn't accidentally delete external assignments isn't necessary because this shortcut should never get broken up and the wrapper should remain continuous
                        var assignments_to_delete = assignment_container.nextUntil(end_of_line_wrapper).addBack().add(end_of_line_wrapper);//.filter(assignment_container => 
                    }
                    $.confirm({
                        title: `Are you sure you want to delete ${assignments_to_delete.length} ${pluralize("assignment", assignments_to_delete.length)} from class "${sa.tags[0]}"?<br>(An assignment's class name is its first tag)`,
                        content: utils.formatting.getReversibilityStatus(),
                        buttons: {
                            confirm: {
                                keys: ['Enter'],
                                action: function() {
                                    const assignment_ids_to_delete = assignments_to_delete.map(function() {
                                        const dom_assignment = $(this).children(".assignment");
                                        const _sa = utils.loadAssignmentData(dom_assignment);
                                        return _sa.id;
                                    }).toArray();
                                    const success = function() {
                                        $this.off("click");
                                        assignments_to_delete.each(function() {
                                            new Crud().transitionDeleteAssignment($(this).children(".assignment"));
                                        });
                                    }
                
                                    if (ajaxUtils.disable_ajax) {
                                        success();
                                        return;
                                    }
                                    $.ajax({
                                        type: "DELETE",
                                        url: "/api/delete-assignment",
                                        data: {assignments: assignment_ids_to_delete},
                                        success: success,
                                        error: ajaxUtils.error,
                                    });
                                }
                            },
                            cancel: function() {
                                
                            }
                        }
                    });
                });
            },
        },
        addTagHandlers: function() {
            function transitionCloseTagBox($tag_add) {
                const tag_add_box = $tag_add.find(".tag-add-box");

                tag_add_box.css({
                    height: "unset",
                    overflow: "visible",
                });

                tag_add_box.one("transitionend", function() {
                    tag_add_box.css({
                        height: "",
                        overflow: "",
                    });
                    tag_add_box.find(".tag-add-selection-item").remove();
                    tag_add_box.find(".tag-add-button").removeAttr("tabindex");
                    tag_add_box.find(".tag-add-input").attr("tabindex", "-1");
                });
            }
            // might be easier to attach the click to $(document) but will do later
            $(".tag-add").click(tagAddClick);
            let tag_names = new Set();
            function tagAddClick(e) {
                const $this = $(this);
                const dom_assignment = $this.parents(".assignment");
                // Close add tag box if "Add Tag" is clicked again
                if (($(e.target).hasClass("tag-add") || $(e.target).parent(".tag-add").length) && dom_assignment.hasClass("open-tag-add-box")) {
                    dom_assignment.removeClass("open-tag-add-box");
                    transitionCloseTagBox($this);
                    return;
                }
                // Plus button was clicked
                if ($(e.target).is(".tag-add-button, .tag-add-button > .icon-slash")) {
                    const sa = utils.loadAssignmentData($this);

                    const checked_tag_names = $this.find(".tag-add-selection-item.checked .tag-add-selection-item-name").map(function() {
                        return $(this).text();
                    }).toArray();
                    // Push all checked tag names not already in tag_names to tag_names
                    checked_tag_names.forEach(tag_names.add, tag_names);
                    
                    const inputted_tag_name = $this.find(".tag-add-input").val().trim();
                    if (inputted_tag_name && inputted_tag_name !== "Too Many Tags!" && !tag_names.has(inputted_tag_name)) {
                        tag_names.add(inputted_tag_name);
                    }
                    // Nothing is checked or inputted
                    if (!tag_names.size) {
                        if (utils.ui.close_on_success) {
                            utils.ui.close_on_success = false;
                            $this.find(".tag-add-input").blur();
                        }
                        return;
                    }
                    tag_names = new Set([...tag_names].filter(tag_name => !sa.tags.includes(tag_name)));

                    if (sa.tags.length + tag_names.size > MAX_NUMBER_OF_TAGS) {
                        $(this).find(".tag-add-button").addClass("tag-add-red-box-shadow");
                        $(this).find(".tag-add-input").val("Too Many Tags!");
                        tag_names = new Set();
                        return;
                    }
                    const success = function() {
                        if (utils.ui.close_on_success) {
                            utils.ui.close_on_success = false;
                            $this.find(".tag-add-input").blur();
                        }
                        // Add tags to dat locally
                        sa.tags.push(...tag_names);

                        // There are too many conditions on whether to sort or not, so just sort every time

                        // sa.needs_more info for GC class tags or for first_tag sorting for non GC assignments
                        // "important" and "not important" because they were designed to affect priority
                        // if (sa.needs_more_info || tag_names.has("Important") || tag_names.has("Not Important")) {
                            new Priority().sort();
                        // }

                        // Close box and add tags visually
                        dom_assignment.removeClass("open-tag-add-box");
                        transitionCloseTagBox($this);
                        for (let tag_name of tag_names) {
                            const tag = $($("#tag-template").html());
                            tag.find(".tag-name").text(tag_name);
                            tag.find(".tag-delete").click(tagDelete).attr("data-tag-deletion-name", tag_name).attr("data-assignment-id", sa.id);
                            tag.appendTo($this.parents(".tags").find(".tag-sortable-container"));

                            tag.addClass("tag-add-transition-disabler");
                            // Need to use jquery instead of css to set marginLeft
                            tag.css({
                                marginLeft: -tag.outerWidth(true),
                                opacity: "0",
                                transform: "scale(0.6)",
                            });
                            tag[0].offsetHeight;
                            tag.removeClass("tag-add-transition-disabler");
                            tag.css({
                                marginLeft: "",
                                opacity: "",
                                transform: "",
                            });

                            tag.prev().css("z-index", "1");
                            tag.one("transitionend", function() {
                                tag.prev().css("z-index", "");
                            });
                        }
                        tag_names = new Set();
                    }
                    
                    // !tag_names.length to not send an ajax if removing duplicates yield an empty tag list
                    if (ajaxUtils.disable_ajax || !tag_names.size) {
                        success();
                        return;
                    }
                    $.ajax({
                        type: "POST",
                        url: "/api/tag-add",
                        data: {
                            pk: sa.id,
                            tag_names: [...tag_names],
                        },
                        success: success,
                        error: ajaxUtils.error,
                    });
                    return;
                }
                // Tag add textbox was selected or tags were selected
                if (dom_assignment.hasClass("open-tag-add-box")) return;
                dom_assignment.addClass("open-tag-add-box");
                $this.find(".tag-add-button").removeClass("tag-add-red-box-shadow").attr("tabindex", "0");
                $this.find(".tag-add-input").focus().val("").attr("tabindex", "");
                const container_for_tags = $this.find(".tag-add-overflow-hidden-container");

                // This code handles the logic for determining which tags should be added to the tag add dropdown. Let's break this down:

                // Push every tag from every assignment
                let allTags = [];
                dat.forEach(sa => allTags.push(...sa.tags));
                // Filter out duplicate tags
                let unique_allTags = new Set(allTags);
                // Remove "Important" and "Not Important" so they can be added first
                unique_allTags.delete("Important");
                unique_allTags.delete("Not Important");
                // Filter out default dropdown tags so is in a separate sorting group
                let current_assignment_tags = utils.loadAssignmentData(dom_assignment).tags;
                unique_allTags = [...unique_allTags].filter(e => !SETTINGS.default_dropdown_tags.includes(e));

                let final_allTags = [];
                // Add back in "Important", "Not Important"
                final_allTags.push("Important");
                final_allTags.push("Not Important");
                // And default_dropdown_tags
                final_allTags.push(...SETTINGS.default_dropdown_tags);
                // Finally, add sorted unique_allTags
                final_allTags.push(...unique_allTags.sort());
                // Filter out tags that are already in the assignment
                final_allTags = final_allTags.filter(e => !current_assignment_tags.includes(e));



                // The tag add box can be reopened while the transitionend from the transitionCloseTagBox function hasn't yet fired, causing all the tags to disppear
                // Trigger the transitionend if this is the case, and since transitionCloseTagAddBox uses .one, it will be disabled after
                const tag_add_box = $this.find(".tag-add-box");
                tag_add_box.trigger("transitionend");

                for (let tag of final_allTags) {
                    const tag_add_selection_item = $($("#tag-add-selection-item-template").html());
                    tag_add_selection_item.find(".tag-add-selection-item-name").first().text(tag);
                    container_for_tags.append(tag_add_selection_item);
                    tag_add_selection_item.click(function() {
                        $(this).find(".tag-add-checkbox").prop("checked", !$(this).hasClass("checked"));
                        $(this).toggleClass("checked");
                    });
                }
                
            }
            $(".tag-delete").click(tagDelete);
            function tagDelete() {
                const $this = $(this);
                const tag_wrapper = $this.parents(".tag-wrapper");
                if (tag_wrapper.hasClass("tag-is-deleting")) return;
                tag_wrapper.addClass("keep-delete-open");
                
                const sa = utils.loadAssignmentData($this);
                const data = {
                    pk: sa.id,
                    tag_names: [$this.attr("data-tag-deletion-name")],
                }
                const success = function() {
                    // Remove data locally from dat
                    sa.tags = sa.tags.filter(tag_name => !data.tag_names.includes(tag_name));

                    // There are too many conditions on whether to sort or not, so just sort every time

                    // GC class tags
                    // if (sa.is_google_classroom_assignment && sa.needs_more_info || data.tag_names.includes("Important") || data.tag_names.includes("Not Important")) {
                        new Priority().sort();
                    // }

                    tag_wrapper.addClass("tag-is-deleting");
                    // Transition the deletion
                    // Need to use jquery to set css for marginLeft
                    tag_wrapper.css({
                        marginLeft: -tag_wrapper.outerWidth(true),
                        opacity: "0",
                        transform: "scale(0.6)",
                    });
                    tag_wrapper.prev().css("z-index", "1");
                    tag_wrapper.one("transitionend", function() {
                        tag_wrapper.prev().css("z-index", "");
                        tag_wrapper.remove();
                    });
                    $this.parents(".tags").find(".tag-add-button").removeClass("tag-add-red-box-shadow");
                }
                if (ajaxUtils.disable_ajax) {
                    success();
                    return;
                }
                $.ajax({
                    type: "DELETE",
                    url: "/api/tag-delete",
                    data: data,
                    success: success,
                    error: function() {
                        tag_wrapper.removeClass("keep-delete-open");
                        ajaxUtils.error.bind(this)(...arguments);
                    }
                });
            }
            $(".tag-add").focusout(function() {
                const $this = $(this);
                const dom_assignment = $this.parents(".assignment");
                setTimeout(function() {
                    // const tag_add_text_clicked = $(e.currentTarget).is($this) && $(document.activeElement).hasClass("assignment");

                    // If the user unfocuses the closed tag modal which they previously clicked to close, this will run and add the transitionend event in transitionCloseTagBox to the already closed tag-add-box, which is unwanted and causes bugs
                    // I can't just do !$(e.target).is($this) because the tag modal may already be open without the user already previously clicking .tag-add to close it, and the transitionend event is needed in this case
                    // So, only return when the tag modal is closed by adding || $this.find(".tag-add-box").css("height") === 0
                    if ($(document.activeElement).parents(".tag-add").length || $(document.activeElement).is($this) || parseFloat($this.find(".tag-add-box").css("height")) === 0) return;
                    dom_assignment.removeClass("open-tag-add-box");
                    transitionCloseTagBox($this);
                }, 0);
            });
            $(".tag-sortable-container").sortable({
                animation: 150,
                ghostClass: "ghost",
                direction: "horizontal",
                onMove: function(e) {
                    // If the tag is dragged while it's being deleted, it won't be deleted by the above code but it will instead be re-added in its final styles back into .tag-sortable-container
                    // Prevent that from happening
                    return !$(e.dragged).hasClass("tag-is-deleting");
                },
                onEnd: function() {
                    const $this = $(this.el);
                    const sa = utils.loadAssignmentData($this);
                    sa.tags = $this.find(".tag-wrapper").filter(function() {
                        // Also remove z-index if it wasnt reset back to none from dragging the tag around
                        return !$(this).css("z-index","").hasClass("tag-is-deleting");
                    }).map(function() {
                        return $(this).find(".tag-name").text();
                    }).toArray();

                    // There are too many conditions on whether to sort or not, so just sort every time

                    // GC class tags
                    //sa.is_google_classroom_assignment && sa.needs_more_info && 
                    new Priority().sort();
                    
                    ajaxUtils.sendAttributeAjaxWithTimeout("tags", sa.tags, sa.id);
                }
            });
        },
        setKeybinds: function() {
        $(document).keydown(function(e) {
        if (e.ctrlKey || e.metaKey) return;
        switch (e.key) {
            case "n":
            case "e":
            case "d":
            case "D":
            case "h":
            case "Backspace":
            case "s":
            case "f":
            case "o":
            case "c":
            case "t":
                if ($(document.activeElement).prop("tagName").toLowerCase() !== "input")
                switch (e.key) {
                    case "n":
                        setTimeout(() => { // Fix typing on the assignment form itself
                            !$("#overlay").is(":visible") && $("#image-new-container").click();
                        }, 0);
                        break;
                    case "t":
                        $("#assignments-container").scrollTop(0);
                        break;
                    case "e":
                    case "d":
                    case "D":
                    case "h":
                    case "Backspace":
                    case "s":
                    case "f":
                    case "o":
                    case "c":
                        let assignment_container = $(":hover").filter(".assignment-container");
                        if (!assignment_container.length) assignment_container = $(document.activeElement).parents(".assignment-container");
                        let dom_assignment = assignment_container.children(".assignment");
                        if (assignment_container.length) {
                            if (!dom_assignment.hasClass("has-been-clicked")) {
                                new VisualAssignment(dom_assignment).initUI();
                            }
                            switch (e.key) {
                                case "o":
                                case "c":
                                    dom_assignment.click();
                                    break;
                                case "e":
                                    // Fix typing on the assignment form itself
                                    setTimeout(function() {
                                        assignment_container.find(".update-button").parents(".assignment-header-button").focus().click();
                                    }, 0);
                                    break;
                                case "d":
                                    assignment_container.find(".delete-button").parents(".assignment-header-button").focus().click();
                                    break;
                                case "D":
                                    const click_delete_button = $.Event("click");
                                    click_delete_button.shiftKey = e.shiftKey;
                                    assignment_container.find(".delete-button").parents(".assignment-header-button").focus().trigger(click_delete_button);
                                    break;
                                case "f":
                                    assignment_container.find(".tick-button").is(":visible") && assignment_container.find(".tick-button").parents(".assignment-header-button").focus().click();
                                    break;
                                case "h":
                                    assignment_container.find(".hide-assignment-button").focus().click();
                                    break;
                                case "Backspace":
                                case "s":
                                    if (dom_assignment.hasClass("open-assignment"))
                                    switch (e.key) {
                                        case "Backspace":
                                            assignment_container.find(".delete-work-input-button").focus().click();
                                            break;
                                        case "s":
                                            assignment_container.find(".skew-ratio-button").focus().click();
                                            break;
                                    }
                                    break;
                            }
                            break;
                        }
                }
                break;

            case "Tab":
                // Prevent tabbing dispositioning screen
                setTimeout(() => $("#site")[0].scrollTo(0,0), 0);
                break;
            case "Escape":
                new Crud().hideForm();
                break;
            case "ArrowDown":
            case "ArrowUp":
                const open_assignmens_on_screen = $(".open-assignment").filter(function() {
                    return new VisualAssignment($(this)).assignmentGraphIsOnScreen();
                });
                if (e.shiftKey) {
                    if (e.key === "ArrowDown") {
                        // If there is an open assignment in view, select that one and 
                        const first_open_assignment = $(".assignment.open-assignment").first();
                        if (first_open_assignment.length) {
                            var assignment_to_be_opened = first_open_assignment.parents(".assignment-container").next().children(".assignment");
                            first_open_assignment[0].scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                        } else {
                            var assignment_to_be_opened = $(".assignment").first();
                            assignment_to_be_opened[0].scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                        }
                        first_open_assignment.click();
                        if (!assignment_to_be_opened.hasClass("open-assignment")) {
                            assignment_to_be_opened.click();
                        }
                    } else if (e.key === "ArrowUp") {
                        // If there is an open assignment in view, select that one and 
                        const last_open_assignment = $(".assignment.open-assignment").last();
                        if (last_open_assignment.length) {
                            var assignment_to_be_opened = last_open_assignment.parents(".assignment-container").prev().children(".assignment");
                            if (assignment_to_be_opened.length) {
                                assignment_to_be_opened[0].scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                });
                            }
                        } else {
                            var assignment_to_be_opened = $(".assignment").last();
                        }
                        last_open_assignment.click();
                        if (!assignment_to_be_opened.hasClass("open-assignment")) {
                            assignment_to_be_opened.click();
                        }
                        if (!last_open_assignment.length) {
                            assignment_to_be_opened[0].scrollIntoView({
                                behavior: 'smooth',
                                block: 'end',
                            });        
                        }
                    }
                } else if (open_assignmens_on_screen.length !== 0) {
                    // Prevent arrow scroll
                    e.preventDefault();
                } else {
                    // Allow arrow scroll
                    // Relies on the fact that #assignments-container is the scrolling element
                    $("#assignments-container").focus();
                }
                break;
        }
        });
        $(".tag-add-input").keydown(function(e) {
            if (e.key === "Enter") {
                utils.ui.close_on_success = true;
                $(this).parents(".tags").find(".tag-add-button").click();
            }
        });
        },
        displayFullDueDateOnHover: function() {
            $(".title").on("mouseover mousemove click", function(e) {
                $(this).toggleClass("show-long-daysleft", e.offsetY > $(this).height());
                if (isTouchDevice && e.offsetY > $(this).height()) return false;
            }).on("mouseout", function() {
                $(this).removeClass("show-long-daysleft");
            });
        },
        setAssignmentScaleUtils: function() {
            // width * percentx = width+10
            // percentx = 1 + 10/width
            $(window).resize(function() {
                $("#assignments-container").css('--scale-percent-x',`${1 + 10/$(".assignment").first().width()}`);
                $(".assignment").each(function() {
                    const $this = $(this);
                    const sa = new VisualAssignment($this);
                    sa.positionTags();
                    sa.displayTruncateWarning();
                });
            });
            // #animate-in is initially display: hidden in priority.js, delay adding the scale
            document.fonts.ready.then(function() {
                setTimeout(function() {
                    // height * percenty = height+5
                    // percenty = 1 + 5/height
                    $("#assignments-container").css('--scale-percent-x',`${1 + 10/$(".assignment").first().width()}`);
                    $(".assignment").each(function() {
                        if (1 + 10/$(this).height() > 1.05) return;
                        $(this).css('--scale-percent-y',`${1 + 10/$(this).height()}`);
                    });
                }, 0);
            });
        },
        setAnimationSpeed: function() {
            $("main").css('--animation-speed', SETTINGS.animation_speed);
            if (SETTINGS.animation_speed !== 0) return;

            $(".assignment").each(function() {
                this.style.setProperty('--scale-percent-x', '1', 'important');
                this.style.setProperty('--scale-percent-y', '1', 'important');
            });
        },
        insertTutorialMessages: function(first_available_assignment) {
            $("#tutorial-click-assignment-to-open").remove();
            if (SETTINGS.enable_tutorial) {
                const assignments_excluding_example = $(".assignment").filter(function() {
                    return utils.loadAssignmentData($(this)).name !== EXAMPLE_ASSIGNMENT_NAME;
                });
                if (assignments_excluding_example.length) {
                    first_available_assignment.after($("#tutorial-click-assignment-to-open-template").html());
                    if (!utils.ui.alreadyScrolled) {
                        // setTimeout needed because this runs before domSort
                        setTimeout(function() {
                            $("#tutorial-click-assignment-to-open")[0].scrollIntoView({behavior: 'smooth', block: 'nearest'});
                        }, 0);
                        utils.ui.alreadyScrolled = true;
                    }
                } else {
                    $("#assignments-header").replaceWith('<div id="tutorial-message"><div>Welcome to TimeWeb! Thank you so much for your interest!</div><br><div>Create your first school or work assignment by clicking the plus icon to get started.</div></div>');
                    $(".assignment-container, #current-date-container").hide();
                }
            }
        },
        graphAlertTutorial: function(days_until_due) {
            $.alert({
                title: "Welcome to the graph, a visualization of your assignment's entire work schedule. It is highly recommended to read the graph's section on TimeWeb's <a href=\"/user-guide#what-is-the-assignment-graph\">user guide</a> to understand how to use it." + (isExampleAccount ? "" : "<br><br>Once you're finished, check out the settings to set your preferences."),
                content: days_until_due <= 3 ? `Note: since this assignment is due in only ${days_until_due} ${pluralize("day", days_until_due)}, there isn't much to display on the graph. Check out your example assignment or the example account on the login page to see how TimeWeb handles longer and more complicated assignments.` : '',
                backgroundDismiss: false,
                alignTop: true, // alignTop is a custom extension
                onClose: function() {
                // Service worker push notifs API hasn't yet been implemented :-(
                // Code once it is implemented:

                //     $.alert({
                //         title: "Would you like to allow TimeWeb to send notifications?",
                //         content: "You will be notified of your total estimated completion time daily. If you accidentally click no, you can come back to this popup by re-enabling the tutorial in the settings.",
                //         backgroundDismiss: false,
                //         alignTop: true, // alignTop is a custom extension
                //         buttons: {
                //             // https://css-tricks.com/creating-scheduled-push-notifications/
                //             yes: {
                //                 action: async function() {
                //                     const reg = await navigator.serviceWorker.getRegistration();
                //                     Notification.requestPermission().then(permission => {
                //                         if (permission === 'granted') {
                //                             reg.showNotification(
                //                                 'Demo Push Notification',
                //                                 {
                //                                     tag: timestamp, // a unique ID
                //                                     body: 'Hello World', // content of the push notification
                //                                     data: {
                //                                         url: window.location.href, // pass the current url to the notification
                //                                     },
                //                                     badge: "images/icon-192x192.png",
                //                                     icon: "images/icon-192x192.png",
                //                                     actions: [
                //                                         {
                //                                             action: 'open',
                //                                             title: 'Open app',
                //                                         },
                //                                         {
                //                                             action: 'close',
                //                                             title: 'Close notification',
                //                                         }
                //                                     ]
                //                                 }
                //                             );
                //                         }
                //                     });
                //                 }
                //             },
                //             no: {
                //                 action: async function() {
                //                     const reg = await navigator.serviceWorker.getRegistration();
                //                     const notifications = await reg.getNotifications({
                //                         includeTriggered: true
                //                     });
                //                     notifications.forEach(notification => notification.close());
                //                 }
                //             }
                //         },
                //         onClose: function() {
                //             SETTINGS.enable_tutorial = false;
                //             ajaxUtils.ajaxChangeSetting({setting: "enable_tutorial", value: SETTINGS.enable_tutorial});
                //         },
                //     });
                    SETTINGS.enable_tutorial = false;
                    ajaxUtils.ajaxChangeSetting({setting: "enable_tutorial", value: SETTINGS.enable_tutorial});
                }
            });
        },
        exampleAccountAlertTutorial: function() {
            if (sessionStorage.getItem("already-alerted-example-account")) return;
            sessionStorage.setItem("already-alerted-example-account", true);
            $.alert({
                title: "Hey there! Thanks for checking out the example account. Here, you'll get a clear perspective of how you should expect TimeWeb to look like<br><br>Feel free to look around or make any changes you want to any assignment",
                backgroundDismiss: false,
            });
        },
        saveAndLoadStates: function() {



            // IMPORTANT!
            // Make sure to reset storages appropriately in timewebauth/static/js/timewebauth/login.js



            // Saves current open assignments and scroll position to localstorage and sessionstorage if refreshed or redirected
            // Use beforeunload instead of unload or else the loading screen triggers and $("#assignments-container").scrollTop() becomes 0
            $(window).on('beforeunload', function() {
                if (!SETTINGS.enable_tutorial) {
                    // Save current open assignments
                    sessionStorage.setItem("open_assignments", JSON.stringify(
                        $(".assignment.open-assignment").map(function() {
                            return $(this).attr("data-assignment-id")
                        }).toArray()
                    ));
                    // Save scroll position
                    localStorage.setItem("scroll", $("#assignments-container").scrollTop());
                }
                // Send ajax before close if it's on timeout
                if (ajaxUtils.sendAttributeAjax.assignments.length) {
                    ajaxUtils.sendAttributeAjax();
                }
            });

            // Ensure fonts load for the graph
            document.fonts.ready.then(function() {
                if (!SETTINGS.enable_tutorial) 
                    // setTimeout so the assignments are clicked after the click handlers are set
                    setTimeout(function() {
                        // Reopen closed assignments
                        if ("open_assignments" in sessionStorage) {
                            const open_assignments = JSON.parse(sessionStorage.getItem("open_assignments"));
                            $(".assignment").filter(function() {
                                return open_assignments.includes($(this).attr("data-assignment-id"));
                            }).click();
                        }

                        // Scroll to original position
                        // Needs to scroll after assignments are opened
                        if ("scroll" in localStorage) {
                            $("#assignments-container").scrollTop(localStorage.getItem("scroll"));
                            localStorage.removeItem("scroll");
                        }
                    }, 0);
                let date_now = new Date();
                if (date_now.getDate() - new Date(+localStorage.getItem("last_visit")).getDate() === 1 && date_now.getHours() < 4) {
                    // if it's been a day since the last visit and it's before 4am, remind them that the current date has changed
                    // this alert is for fellow insomniacs who lose track of time
                    $("#current-date-container").append("<span id=\"currently-has-changed-notice\">(has changed)</span>");
                }
                localStorage.setItem("last_visit", date_now.valueOf());
            });
        }
    },
    reloadAtMidnight: function() {
        // Reloads the page after midnight hour to update the graph
        const now = utils.getRawDateNow();
        // this is essentially doing floor() + 1
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const reload_time = midnight.getTime() + 1000 * 60 * 60 * 24;
        if (now.getTime() < reload_time) {
            setTimeout(function() {
                // Don't reload in the next day to preserve changes made in the simulation
                // Don't reload in the example account because date_now set in the example account causes an infinite reload loop
                if (utils.in_simulation || isExampleAccount) return;
                reloadWhenAppropriate();
            }, reload_time - now.getTime() + utils.SCHEDULED_TIMEOUT_DELAY);
        }
    },
    loadAssignmentData: function($element_with_id_attribute, directly_is_pk=false) {
        if (directly_is_pk) return dat.find(assignment => assignment.id == $element_with_id_attribute);
        return dat.find(assignment => assignment.id == $element_with_id_attribute.attr("data-assignment-id"));
    },
    getRawDateNow: function(params={ accurate_in_simulation: true, initial_define: false }) {
        if (SETTINGS.timezone) {
            var raw_date_now = new Date(new Date().toLocaleString("en-US", {timeZone: SETTINGS.timezone}));
        } else {
            var raw_date_now = new Date();
        }
        if (params.accurate_in_simulation && !params.initial_define) {
            let complete_date_now = new Date(date_now.valueOf());
            complete_date_now.setHours(raw_date_now.getHours(), raw_date_now.getMinutes(), 0, 0);
            return complete_date_now;
        } else {
            return raw_date_now;
        }
    },
    SCHEDULED_TIMEOUT_DELAY: 5000,
}

isExampleAccount = ACCOUNT_EMAIL === EXAMPLE_ACCOUNT_EMAIL || EDITING_EXAMPLE_ACCOUNT;


// It's important to remember to NOT use .done() or any other callback method on a jquery ajax
// This is to allow ajaxUtils.error to redo the ajax with the appropriate callbacks
// The only way to properly configure such an ajax is to define their callbacks inline
// I'm not really sure how to ensure I do this for forward compatibility so I just hope I'll stumble upon this text again or
// Somehow remember this in the future /shrug


ajaxUtils = {
    disable_ajax: isExampleAccount && !EDITING_EXAMPLE_ACCOUNT, // Even though there is a server side validation for disabling ajax on the example account, initally disable it locally to ensure things don't also get changed locally
    error: function(response, textStatus) {
        if (ajaxUtils.silence_errors) return;
        assert(this.xhr); // Ensure "this" refers to a jquery ajax
        let title;
        let content;
        switch (response.status) {
            case 0:
                title = "Failed to connect.";
                content = "We can't establish a connection with the server. Check your connection and try again.";
                break;
            case 404:
                title = "Not found.";
                content = "Refresh or try again.";
                break;
            case 500:
                title = "Internal server error.";
                content = "Please <a href=\"/contact\">contact us</a> if you see this, and try to provide context on how the issue happened.";
                break;
            default:
                title = `<p>Whoops, we've encountered an error of type "${textStatus}" while trying to connect with the server:</p>${response.responseText||response.statusText}`;
        }
        $.alert({
            title: title,
            content: content,
            backgroundDismiss: false,
            buttons: {
                ok: {

                },
                "reload this page": {
                    action: function() {
                        reloadWhenAppropriate();
                    },
                },
                "try again": {
                    action: () => {
                        $.ajax(this);
                    },
                },
            },
        });
    },
    ajaxChangeSetting: function(kwargs={}) {
        if (ajaxUtils.disable_ajax) return;
        $.ajax({
            type: "PATCH",
            url: '/api/change-setting',
            data: {
                setting: kwargs.setting,
                value: JSON.stringify(kwargs.value),
            },
            error: ajaxUtils.error,
        });
    },
    createGCAssignments: function() {
        if (ajaxUtils.disable_ajax || !CREATING_GC_ASSIGNMENTS_FROM_FRONTEND) return;
        $.ajax({
            type: "POST",
            url: '/api/create-gc-assignments',
            error: function(jqXHR) {
                switch (jqXHR.status) {
                    case 302:
                        var reauthorization_url = jqXHR.responseText;
                        $("#toggle-gc-api").removeClass("clicked");
                        $.alert({
                            title: "Invalid credentials.",
                            content: "Your Google Classroom integration credentials are invalid. Please authenticate again or disable its integration.",
                            buttons: {
                                "disable integration": {
                                    action: function() {
                                        $("#toggle-gc-api").click();
                                    }
                                },
                                "authenticate again": {
                                    action: function() {
                                        reloadWhenAppropriate({href: reauthorization_url});
                                    }
                                },
                            }
                        });
                        break;

                    default:
                        ajaxUtils.error.bind(this)(...arguments);
                }
            },
            success: function(response, textStatus, jqXHR) {
                switch (jqXHR.status) {
                    case 204:
                        $("#toggle-gc-api").removeClass("clicked");
                        if (SETTINGS.oauth_token.token) {
                            $("#toggle-gc-api").text("Disable Google Classroom integration");
                        } else {
                            $("#toggle-gc-api").text("Enable Google Classroom integration");
                        }
                        break;
    
                    case 205:
                        reloadWhenAppropriate();
                        break;
                }
            },
        });
    },
    sendAttributeAjaxWithTimeout: function(key, value, pk) {

        // Add key and values to the data being sent
        // This way, if this function is called multiple times for different keys and values, they are all sent in one ajax rather than many smaller ones
        let sa = ajaxUtils.sendAttributeAjax.assignments.find(sa => sa.pk === pk);
        if (!sa) {
            sa = {pk: pk};
            ajaxUtils.sendAttributeAjax.assignments.push(sa);
        }
        sa[key] = value;

        if (ajaxUtils.disable_ajax) {
            // Reset data
            ajaxUtils.sendAttributeAjax.assignments = [];
            return;
        }
        clearTimeout(ajaxUtils.ajaxTimeout);
        ajaxUtils.ajaxTimeout = setTimeout(ajaxUtils.sendAttributeAjax, 1000);
    },
    sendAttributeAjax: function() {
        if (!ajaxUtils.sendAttributeAjax.assignments.length) return;

        // Send data along with the assignment's primary key

        // It is possible for users to send data that won't make any difference, for example they can quickly click fixed_mode twice, yet the ajax will still send
        // Coding in a check to only send an ajax when the data has changed is tedious, as I have to store the past values of every button to check with the current value
        // Plus, a pointless ajax of this sort won't happen frequently and will have a minimal impact on the server's performance
        $.ajax({
            type: "PATCH",
            url: '/api/save-assignment',
            data: {assignments: JSON.stringify(ajaxUtils.sendAttributeAjax.assignments)},
            error: function(response) {
                if (response.status === 413) {
                    $.alert({
                        title: "An assignment has too many work inputs and can no longer be saved.",
                        content: "Change its assignment date to today to truncate its work inputs and continue using it.",
                        backgroundDismiss: false,
                    });
                    return;
                }
                ajaxUtils.error.bind(this)(...arguments);
            },
        });
        ajaxUtils.sendAttributeAjax.assignments = [];
    },
}
ajaxUtils.sendAttributeAjax.assignments = [];

SETTINGS = JSON.parse(document.getElementById("settings-model").textContent);
SETTINGS.animation_speed = +SETTINGS.animation_speed;
if (!SETTINGS.seen_latest_changelog) {
    latest_changelog = JSON.parse(document.getElementById("latest-changelog").textContent);
    setTimeout(function() {
        const jconfirm = $.alert({
            title: `Hey there! A new update is here :D!<br><br>${latest_changelog.version}`,
            content: latest_changelog.updates + "This can also be viewed on TimeWeb's <a href=\"/changelog\">changelog</a>.",
            backgroundDismiss: false,
            onClose: function() {
                SETTINGS.seen_latest_changelog = true;
                ajaxUtils.ajaxChangeSetting({setting: "seen_latest_changelog", value: SETTINGS.seen_latest_changelog});
            }
        });
        setTimeout(function() {
            jconfirm.$content.prop("style").setProperty("opacity", "0.85", "important");
            jconfirm.$titleContainer.css("padding-bottom", 5);
        }, 0);
    }, 500);
}
SETTINGS.def_break_days = SETTINGS.def_break_days.map(Number);
date_now = new Date(utils.getRawDateNow({ initial_define: true }).toDateString());
SETTINGS.highest_priority_color = utils.formatting.hexToRGB(SETTINGS.highest_priority_color);
SETTINGS.lowest_priority_color = utils.formatting.hexToRGB(SETTINGS.lowest_priority_color);
SETTINGS.def_due_time = SETTINGS.def_due_time.split(":");
SETTINGS.def_due_time = {
    hour: +SETTINGS.def_due_time[0],
    minute: +SETTINGS.def_due_time[1],
}
if (isExampleAccount) {
    x_transform = mathUtils.daysBetweenTwoDates(date_now, new Date(2021, 4, 3));
}
// Load in assignment data
dat = JSON.parse(document.getElementById("assignment-models").textContent);
for (let sa of dat) {
    if (sa.assignment_date) {
        sa.assignment_date = new Date(sa.assignment_date);
        // Don't really know what to do for assignment dates on different tzs (since they are stored in utc) so i'll just round it to the nearest day
        // Add half a day and flooring it rounds it
        sa.assignment_date = new Date(sa.assignment_date.valueOf() + 12*60*60*1000);
        sa.assignment_date.setHours(0,0,0,0);
    } else {
        sa.assignment_date = new Date(date_now.valueOf());
        sa.fake_assignment_date = true;
    }

    if (sa.due_time) {
        sa.due_time = sa.due_time.split(":");
        sa.due_time = {
            hour: +sa.due_time[0],
            minute: +sa.due_time[1],
        }
    }
    // Don't do Number.isFinite(x) because this is the raw value
    if (sa.x) {
        sa.x = new Date(sa.x);
        // floor(date + 0.5) is the same as round(date)
        sa.x.setHours(sa.x.getHours() + 24/2);
        sa.x.setHours(0, 0, 0, 0);
        
        if (sa.due_time) {
            let complete_due_date = new Date(sa.x.getFullYear(), sa.x.getMonth(), sa.x.getDate(), sa.due_time.hour, sa.due_time.minute);
            let raw_date_now = new Date(utils.getRawDateNow().valueOf());
            let time_diff = complete_due_date - raw_date_now;
            if (time_diff + utils.SCHEDULED_TIMEOUT_DELAY > 0)
                $(window).one("load", function() {
                    setTimeout(function() {
                        new Priority().sort();
                    // Hardcoded delay if setTimeout isn't accurate
                    }, time_diff + utils.SCHEDULED_TIMEOUT_DELAY);
                });
            // If the due date exists but the assignment date doesn't meaning assignment needs more info, set the due date number to the due date and today
            sa.x = mathUtils.daysBetweenTwoDates(sa.x, sa.assignment_date);
            sa.complete_x = mathUtils.daysBetweenTwoDates(complete_due_date, sa.assignment_date, {round: false});
        } else {
            // If the due date exists but the assignment date doesn't meaning assignment needs more info, set the due date number to the due date and today
            sa.x = mathUtils.daysBetweenTwoDates(sa.x, sa.assignment_date);
            sa.complete_x = sa.x;
        }
        

        if (sa.due_time && (sa.due_time.hour || sa.due_time.minute)) {
            sa.x++;
        }
        if (sa.name === EXAMPLE_ASSIGNMENT_NAME) {
            sa.assignment_date = new Date(date_now.valueOf());
            sa.fake_assignment_date = false;
        }
        if (isExampleAccount) {
            sa.assignment_date.setDate(sa.assignment_date.getDate() + x_transform);
            sa.fake_assignment_date = false; // probably isnt needed but ill keep this here anyways
        }
    }
    // Repopulating the form
    sa.original_min_work_time = +sa.min_work_time;

    if (sa.y) sa.y = +sa.y;
    if (sa.time_per_unit) sa.time_per_unit = +sa.time_per_unit;
    if (sa.funct_round) sa.funct_round = +sa.funct_round;
    if (sa.min_work_time) sa.min_work_time /= sa.time_per_unit; // Converts min_work_time to int if string or null
    if (sa.skew_ratio) sa.skew_ratio = +sa.skew_ratio;
    sa.works = sa.works.map(Number);
    sa.break_days = sa.break_days.map(Number);
    if (!sa.tags) sa.tags = [];

    const red_line_start_x = sa.fixed_mode ? 0 : sa.dynamic_start; // X-coordinate of the start of the red line
    const red_line_start_y = sa.fixed_mode ? 0 : sa.works[red_line_start_x - sa.blue_line_start]; // Y-coordinate of the start of the red line

   
    
    // Caps and adjusts min_work_time and funct_round; needed in parabola.js i think
    let y1 = sa.y - red_line_start_y;
    if (Number.isFinite(sa.funct_round) && Number.isFinite(y1) && sa.funct_round > y1 && y1) { // && y1 to ensure funct_round isn't 0, which causes Assignment.funct to return NaN
        sa.funct_round = y1;
    }
    if (Number.isFinite(sa.min_work_time) && Number.isFinite(y1) && sa.min_work_time > y1) {
        sa.min_work_time = y1;
    }

    // If funct_round is greater than min_work_time, every increase in work already fulfills the minimum work time
    // Set it to 0 to assume it isn't enabled for calculations in setParabolaValues()
    if (Number.isFinite(sa.min_work_time) && Number.isFinite(sa.funct_round) && sa.min_work_time <= sa.funct_round) {
        sa.min_work_time = 0;
    }

    if (isExampleAccount) {
        sa.break_days = sa.break_days.map(break_day => (break_day + x_transform) % 7);
    }
};
// Use DOMContentLoaded because $(function() { fires too slowly
document.addEventListener("DOMContentLoaded", function() {
    // Define csrf token provided by backend
    csrf_token = $("input[name=\"csrfmiddlewaretoken\"]").first().val();
    $.ajaxSetup({
        headers: {
            'X-CSRFToken': csrf_token
        },
    });
    utils.reloadAtMidnight();
    if (SETTINGS.oauth_token.token) ajaxUtils.createGCAssignments();
    utils.ui.setClickHandlers.tickButtons();
    utils.ui.setClickHandlers.assignmentsHeaderUI();
    utils.ui.setClickHandlers.assignmentSorting();
    utils.ui.setClickHandlers.googleClassroomAPI();
    utils.ui.setClickHandlers.deleteAllStarredAssignments();
    utils.ui.setClickHandlers.deleteAssignmentsFromClass();
    utils.ui.setClickHandlers.autofillWorkDone();
    utils.ui.addTagHandlers();
    utils.ui.setKeybinds();
    utils.ui.displayFullDueDateOnHover();
    utils.ui.setAssignmentScaleUtils();
    utils.ui.setAnimationSpeed();
    utils.ui.saveAndLoadStates();
    // https://stackoverflow.com/questions/23449917/run-js-function-every-new-minute
    let secondsRemaining = (60 - new Date().getSeconds()) * 1000;
    setTimeout(function() {
        utils.ui.tickClock();
        setInterval(utils.ui.tickClock, 60000);
        setInterval(() => $(window).trigger("resize"), 60000*60);
    }, secondsRemaining);
});