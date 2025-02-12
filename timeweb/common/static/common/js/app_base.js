document.addEventListener("DOMContentLoaded", function() {
    $.ajaxSetup({
        headers: {
            'X-CSRFToken': $("input[name=\"csrfmiddlewaretoken\"]").first().val()
        },
    });
});
$(function() {
    $(window).on("focus", () => $(window).trigger("resize"));
    $(document).keydown(function(e) {
        switch (e.key) {
            case "Enter": {
                const activeElement = $(document.activeElement);
                if (
                    // Prevent double dipping
                    // I *could* use e.preventDefault instead for forward compatibility, but is risky and prevents some functioanlities
                    // (such as pressing enter to submit a form)
                    !activeElement.is('button, summary, input[type="file"]')
                    // Prevent focused field widgets from toggling on enter form submission
                    && activeElement.attr("tabindex") !== "-1"
                    // keydown fires constantly while enter is being held down, limit it to the first fire
                    && !e.originalEvent.repeat) {
                        activeElement.click();
                }
                break;
            }
            case "Tab":
                // Prevent tabbing dispositioning screen from tabbing on nav
                setTimeout(() => $("#site")[0].scrollTo(0,0), 0);
                break;
        }
    });
    $("input").on("show.daterangepicker", function(e, picker) {
        function dothething(_minuteselect) {
            _minuteselect.on("change", function() {
                setTimeout(function() {
                    // idk why but theres always a new minuteselect element when its changed
                    const minuteselect = picker.container.find(".minuteselect:visible");
                    minuteselect.children("[value=\"59\"]").insertAfter(minuteselect.children("[value=\"0\"]"));
                    dothething(minuteselect);
                }, 0);
            });
        }
        // There's a random invisible datepicker, so only query the one that's visible
        const minuteselect = picker.container.find(".minuteselect:visible");
        minuteselect.children("[value=\"59\"]").insertAfter(minuteselect.children("[value=\"0\"]"));
        dothething(minuteselect);
    // On desktop without an assignment name or on mobile, you can click enter in the form and it will go to the next input without hiding an open daterangepicker
    }).on('blur', function(e) {
        // Can't use relatedTarget because it needs to be on an element with a tabindex, which the daterangepicker doesn't have
        if (!$(":hover").filter(".daterangepicker").length)
            $(this).data("daterangepicker")?.hide();
    });
    // close dropdown if clicked while open
    let wasOpen = false;
    $("#username").mousedown(function(e) {
        wasOpen = $(this).is(document.activeElement) || $(document.activeElement).parents("#username").length;
    }).click(function(e) {
        if (wasOpen)
            $("#username").blur();
    });

    if ($("#user-greeting").length) {
        $(window).resize(resetHeaderLayout);
        resetHeaderLayout();
    }
    $("header > *").css("visibility", "visible");
});
// It's important to remember to NOT use .done() or any other callback method on a jquery ajax
// This is to allow ajaxUtils.error to redo the ajax with the appropriate callbacks
// The only way to properly configure such an ajax is to define their callbacks inline
// I'm not really sure how to ensure I do this for forward compatibility so I just hope I'll stumble upon this text again or
// Somehow remember this in the future /shrug

isExampleAccount = ACCOUNT_EMAIL === EXAMPLE_ACCOUNT_EMAIL || EDITING_EXAMPLE_ACCOUNT;
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
        case 429:
            title = "You are being ratelimited.";
            content = "Try again in a few seconds or minutes.";
            break;
        case 500:
            title = "Internal server error.";
            content = "Please <a href=\"/contact\">contact us</a> if you see this, and try to provide context on how the issue happened.";
            break;
        default:
            title = `<p>Whoops, we've encountered an error${textStatus === "error" ? "" : ` of type "${textStatus}"`} while trying to connect with the server:</p>${response.responseText||response.statusText}`;
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
changeSetting: function(kwargs={}) {
    if (ajaxUtils.disable_ajax) return;
    $.ajax({
        type: "PATCH",
        url: "/api/change-setting",
        data: {
            setting: kwargs.setting,
            value: JSON.stringify(kwargs.value),
        },
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
                    $.alert({
                        title: "Invalid credentials.",
                        content: "Your Google Classroom integration credentials are invalid. Please authenticate again or disable its integration.",
                        buttons: {
                            "disable integration": {
                                action: function() {
                                    ajaxUtils.changeSetting({setting: "oauth_token", value: false});
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
                    break;

                case 205:
                    reloadWhenAppropriate();
                    break;
            }
        },
    });
},
batchRequest: function(batchCallbackName, batchCallback, kwargs={}) {
    if (ajaxUtils.disable_ajax) return;

    switch (batchCallbackName) {
        case "changeSetting": {
            if (!ajaxUtils.batchRequest[batchCallbackName]) {
                ajaxUtils.batchRequest[batchCallbackName] = {};
            }
            let requestData = ajaxUtils.batchRequest[batchCallbackName];
            for (let key in kwargs) {
                requestData[key] = kwargs[key];
            }
            break;
        }
        default: {
            if (!ajaxUtils.batchRequest[batchCallbackName]) {
                ajaxUtils.batchRequest[batchCallbackName] = [];
            }
            assert("id" in kwargs);
            let requestData = ajaxUtils.batchRequest[batchCallbackName].find(requestData => requestData.id === kwargs.id);
            if (!requestData) {
                requestData = {id: kwargs.id};
                ajaxUtils.batchRequest[batchCallbackName].push(requestData);
            }

            for (let key in kwargs) {
                if (key === "id") continue;
                requestData[key] = kwargs[key];
            }
        }
    }
    clearTimeout(ajaxUtils.batchRequest[batchCallbackName + "_timeout"]);
    ajaxUtils.batchRequest[batchCallbackName + "_callback"] = batchCallback;
    ajaxUtils.batchRequest[batchCallbackName + "_timeout"] = setTimeout(() => ajaxUtils.sendBatchRequest(batchCallbackName, batchCallback), 200);
},
sendBatchRequest: function(batchCallbackName, batchCallback) {
    let do_request = false;
    switch (batchCallbackName) {
        case "changeSetting":
            do_request = ajaxUtils.batchRequest[batchCallbackName] !== undefined && Object.keys(ajaxUtils.batchRequest[batchCallbackName]).length;
            break;
        default:
            do_request = ajaxUtils.batchRequest[batchCallbackName]?.length;
    }
    if (do_request)
        batchCallback(ajaxUtils.batchRequest[batchCallbackName]);
    delete ajaxUtils.batchRequest[batchCallbackName];
    delete ajaxUtils.batchRequest[batchCallbackName + "_timeout"];
    delete ajaxUtils.batchRequest[batchCallbackName + "_callback"];
},
saveAssignment: function(batchRequestData) {

    // Send data along with the assignment's primary key

    // It is possible for users to send data that won't make any difference, for example they can quickly click fixed_mode twice, yet the ajax will still send
    // Coding in a check to only send an ajax when the data has changed is tedious, as I have to store the past values of every button to check with the current value
    // Plus, a pointless ajax of this sort won't happen frequently and will have a minimal impact on the server's performance
    $.ajax({
        type: "PATCH",
        url: '/api/save-assignment',
        data: {batchRequestData: JSON.stringify(batchRequestData)},
        error: function(response) {
            switch (response.status) {
                case 413: {
                    $.alert({
                        title: "Too much data to save.",
                        content: "If 1) You're saving an assignment with many work inputs, change its assignment date to today to truncate its work inputs and continue using it. If 2) You're autofilling work done, you will have to manually perform this action for every assignment.",
                        backgroundDismiss: false,
                    });
                    return;
                }
            }
            ajaxUtils.error.bind(this)(...arguments);
        },
    });
},
}

mathUtils = {
    // https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript
    precisionRound: function(number, precision) {
        const factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    },
    daysBetweenTwoDates: function(larger_date, smaller_date, params={round: true}) {
        if (params.round) {
            const diff = (larger_date - smaller_date) / 86400000;
            return Math.round(diff); // Round for DST too
        } else {
            const no_dst_date = new Date(larger_date.valueOf());
            no_dst_date.setHours(no_dst_date.getHours() + (smaller_date.getTimezoneOffset() - larger_date.getTimezoneOffset()) / 60);
            const diff = (no_dst_date - smaller_date) / 86400000;
            return diff;
        }
    },
    clamp: function(low, value, high) {
        return Math.min(Math.max(value, low), high)
    },
    countDecimals: function(n) {
        if (Math.floor(n) === n) return 0;
        return n.toString().split(".")[1].length || 0; 
    },
    sigFigSubtract: function(a, b) {
        const a_decimals = mathUtils.countDecimals(a);
        const b_decimals = mathUtils.countDecimals(b);
        const max_decimals = Math.max(a_decimals, b_decimals);
        return mathUtils.precisionRound(a - b, max_decimals);
    }
}
// https://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
function collision($div1, $div2, params={ margin: 0}) {
    if ($div1.css("display") == "none") {
        var hide_$div1 = true;
        $div1.show();
    }
    if ($div2.css("display") == "none") {
        var hide_$div2 = true;
        $div2.show();
    }
    var left1 = $div1.offset().left;
    var top1 = $div1.offset().top;
    var bottom1 = top1 + $div1.outerHeight(true);
    var right1 = left1 + $div1.outerWidth(true);

    var left2 = $div2.offset().left;
    var top2 = $div2.offset().top;
    var bottom2 = top2 + $div2.outerHeight(true);
    var right2 = left2 + $div2.outerWidth(true);

    hide_$div1 && $div1.hide();
    hide_$div2 && $div2.hide();

    if (bottom1 + params.margin < top2 || top1 - params.margin > bottom2 || right1 + params.margin < left2 || left1 - params.margin > right2) return false;
    return true;
}
function resetHeaderLayout() {
    const username = $("#user-greeting #username"),
        logo = $("#logo-container"),
        welcome = $("#welcome"),
        plus_button_width = $("#image-new-container img").length ? $("#image-new-container img").outerWidth(true) : 0,
        newassignmenttext = $("#new-assignment-text");

    logo.css({
        left: '',
        transform: '',
    });
    logo.find("img").css("width", "");
    welcome.toggle(!collision(welcome, logo, { margin: 30 })); // Do this toggle after the logo's css is reset or it might clip into the logo
    newassignmenttext.length && newassignmenttext.toggle(!collision(newassignmenttext, logo, { margin: 30 }));

    if (!collision(username, logo, { margin: 30 })) return;
    logo.css({
        left: 5 + plus_button_width,
        transform: "none",
    });
    welcome.toggle(!collision(welcome, logo, { margin: 30 }));

    if (!collision(username, logo, { margin: 10 })) return;
    // compress the logo
    logo.find("img").css("width", Math.max(0, username.offset().left-plus_button_width-20-5));
}

reloadResolver = null;
function reloadWhenAppropriate(params={href: null}) {
    new Promise(function(resolve) {
        if ($(".jconfirm").length) {
            reloadResolver = resolve;
        } else {
            resolve();
        }
    }).then(function() {
        if (params.href) {
            window.location.href = params.href;
        } else {
            window.location.reload();
        }
    });
}
jconfirm.defaults = {
    escapeKey: true,
    backgroundDismiss: true,
    draggable: false,

    boxWidth: '50%',
    useBootstrap: false,

    animation: 'zoom',
    closeAnimation: 'scale',
    animateFromElement: false,
};