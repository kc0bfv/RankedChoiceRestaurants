// ----------- General Utility Functions ----------- 
function get_answer_div(answer_id) {
    return dom_lookup("answer-", answer_id)
}

function get_answer_div_desc_div(answer_div) {
    return dom_lookup("desc-", answer_div.id)
}

function get_question_desc_div(question_id) {
    return dom_lookup("question-desc-", question_id)
}

function get_question_selected_div(question_id) {
    return dom_lookup("question-selected-", question_id)
}

function get_question_unselected_div(question_id) {
    return dom_lookup("question-unselected-", question_id)
}

function dom_lookup(prefix, id) {
    return document.getElementById("" + prefix + id)
}

function filter_visible(arr) {
    /* Take an array-like object containing DOM elements, and use j-query
     * to filter out the visible ones
     *
     * Param arr - array-like object containing DOM elements
     *
     * Returns - array containing only visible elements
     */
    return Array.prototype.filter.call(arr,
        function(test_element) {
            return $(test_element).is(":visible");}
    )
}

function is_selected(answer_id, question_id) {
    var sel_div = get_question_selected_div(question_id)

    return get_answer_div(answer_id).parentNode == sel_div
}





// ----------- Less-General Helper Functions ----------- 
function build_tutorial_block(next_to_element, tut_text) {
    if($(next_to_element).is(":visible")) {
        var max_tut_width = "150" // Just a magic number for look
        var tut_border_add = 7 // In css, border is currently about 6 pixels
        
        var tut_div = document.createElement("div")

        // The class is used to style the object, and to remove it later
        tut_div.className = "tutorial_child"

        // Attach event listeners so it can disappear on mouseover
        tut_div.addEventListener("mouseenter",
            function () { this.style.opacity=0; }, false)
        tut_div.addEventListener("mouseleave",
            function () { this.style.opacity=1; }, false)

        tut_div.innerHTML = tut_text

        var src_loc = next_to_element.getBoundingClientRect()
        tut_div.style.top = (src_loc.top + window.pageYOffset) + "px"

        var tut_width = src_loc.left - window.pageXOffset - tut_border_add
        if(tut_width > max_tut_width) {
            tut_width = max_tut_width
        }
        tut_div.style.width = tut_width + "px"

        tut_div.style.left = (src_loc.left - tut_width - tut_border_add) + "px"

        document.body.appendChild(tut_div)
    }
}

function animate_div_move(src_div, dst_div, end_callback) {
    var animate_div = document.createElement("div")
    animate_div.innerHTML = src_div.innerHTML
    animate_div.classList.add("poll_answer")
    animate_div.classList.add("answer_moving")
    animate_div.style.position="fixed"

    var src_bounding = src_div.getBoundingClientRect() 
    animate_div.style.top = src_bounding.top + "px"
    animate_div.style.left = src_bounding.left + "px"
    animate_div.style.height = src_bounding.height + "px"
    animate_div.style.width = src_bounding.width + "px"

    animate_div.style.background = "white"

    document.body.appendChild(animate_div)

    var dest_top = dst_div.getBoundingClientRect().top + "px"
    var dest_left = dst_div.getBoundingClientRect().left + "px"
    $(animate_div).animate(
        {top: dest_top, left: dest_left, opacity: "0"},
        500,
        function() {
            document.body.removeChild(animate_div)
            end_callback()
        }
    )
}

function if_hidden_slide_down(selector, slide_callback) {
    if( $(selector).is(":hidden") ) {
        $(selector).slideDown("slow", slide_callback)
    }
}

function ballot_change_made(func_after) {
    $("#check-ballot-btn").slideDown("fast", function() {
        $("#form").slideUp("fast", function() {
            $("#verify-ballot-area").slideUp("fast", function() {
                    func_after()
            })
        })
    })
}

function number_ballot(question_id) {
    var sel_div = get_question_selected_div(question_id)
    var unsel_div = get_question_unselected_div(question_id)

    for( var i = 0; i < sel_div.childNodes.length; i++ ) {
        var selected_ans_node = sel_div.childNodes[i]
        var ans_rank = document.getElementById("rank-"+selected_ans_node.id)
        ans_rank.innerHTML = i + 1
    }

    for( var i = 0; i < unsel_div.childNodes.length; i++ ) {
        var unselected_ans_node = unsel_div.childNodes[i]
        var ans_rank = document.getElementById("rank-"+unselected_ans_node.id)
        ans_rank.innerHTML = "&nbsp;"
    }
}




// ----------- Tutorial Functions ----------- 
var tutorial_state = 0
var TutorialInputEnum = Object.freeze(
    {UP_BTN:0, DN_BTN:1, ADD_BTN:2, REM_BTN:3, SUBMIT_VIS:4, INFO_BTN:5})

function handle_tutorial(tutorial_input) {
    /* This will manage the state changes for the tutorial
     * The overall diagram is:
     * State 0 - No items are selected. The initial tutorial text should get
     *      created.
     *      When up/down buttons become visible, transition to 1.
     *      When submit button is visible, transition to 4
     * State 1 - Things have been added to the ballot, but no ratings have
     *      been manipulated.  Recommendation for rankings and removing.
     *      When the user has manipulated the rating for any item, state 2
     *      When submit button is visible, transition to 4
     * State 2 - Same as state 1, but waiting for one more up/dn press
     *      When user presses a second button, go to 3
     *      When submit button is visible, transition to 4
     * State 3 - Waiting for submit to be visible
     *      When submit button is visible, transition to 4
     * State 4 - When ballot gets checked and submit button is visible
     *      When user presses any other button, go to 4
     * State 5 - Tutorial done.
     */

    var checkmark_help = "Use the checkmark to add options to your ballot! Vote for any number of options."
    var up_dn_help = "Use the up and down arrows to reorder options to match your preferences. Use the X button to remove options from your ballot."
    var submit_help = "Verify your preferences.  Make changes above if necessary. Submit when you're ready."

    // state_text maps the text to the states
    // state_first maps a number of texts to describe to the states
    var state_text = [checkmark_help, up_dn_help, up_dn_help, "",
        submit_help, ""]
    var state_first = [1, 1, 1, 0, 1, 0]

    // Determine if we should switch states...
    switch(tutorial_state) {
        case 0:
            if(tutorial_input == TutorialInputEnum.SUBMIT_VIS) {
                // Short circuit to state four...
                tutorial_state = 4
            }
            // Count any visible up buttons (at least, taking up space)
            var up_btns = document.getElementsByClassName("poll_move_up")
            var up_vis_cnt = 0
            for(var i = 0; i < up_btns.length; i++) {
                if($(up_btns[i]).is(":visible")) {
                    up_vis_cnt += 1
                }
            }
            if(up_vis_cnt >= 2) {
                tutorial_state = 1
            }
            break
        case 1:
        case 2:
            // If the function was invoked due to an up/dn press...
            if(tutorial_input == TutorialInputEnum.UP_BTN || 
                    tutorial_input == TutorialInputEnum.DN_BTN) {
                tutorial_state += 1
            } else if (tutorial_input == TutorialInputEnum.SUBMIT_VIS) {
                tutorial_state = 4
            }
            break
        case 3:
            if(tutorial_input == TutorialInputEnum.SUBMIT_VIS) {
                tutorial_state = 4
            }
            break
        case 4:
            if(tutorial_input == TutorialInputEnum.UP_BTN || 
                    tutorial_input == TutorialInputEnum.DN_BTN || 
                    tutorial_input == TutorialInputEnum.ADD_BTN || 
                    tutorial_input == TutorialInputEnum.REM_BTN){
                tutorial_state = 5
            }
            break
        case 5:
            // Final state
            break
    }
    
    // Get a list of all the places to display the tutorial
    var next_to_list = []
    switch(tutorial_state) {
        case 0:
            next_to_list = document.getElementsByClassName("poll_move_add")
            break
        case 1:
        case 2:
            next_to_list = document.getElementsByClassName("poll_move_up")
            break
        case 3:
            break
        case 4:
            next_to_list = [document.getElementById("verify-ballot-div-area")]
            break
        case 5:
            break
    }
    next_to_list = filter_visible(next_to_list)

    remove_tutorial_blocks()

    // Add the new tutorial blocks
    for(var i = 0; i < next_to_list.length && i < state_first[tutorial_state];
            i++) {
        build_tutorial_block(next_to_list[i], state_text[tutorial_state])
    }
}

function remove_tutorial_blocks() {
    var element_list = []
    do {
        for(var i = 0; i < element_list.length; i++) {
            document.body.removeChild(element_list[i])
        }
        element_list = document.body.getElementsByClassName("tutorial_child")
    } while( element_list.length > 0 )
}

// Run handle_tutorial as soon as the DOM is ready
$(document).ready(handle_tutorial)





// ----------- Functions Referenced In HTML ----------- 
function move_up(answer_id, question_id) {
    ballot_change_made( function() {
        var answer_div = get_answer_div(answer_id)
        var prev_sib = answer_div.previousSibling

        if(is_selected(answer_id, question_id) && prev_sib != null && 
                !$("*").is(":animated")) {
            remove_tutorial_blocks()
            animate_div_move(answer_div, prev_sib,
                function() {
                    handle_tutorial(TutorialInputEnum.UP_BTN)
                }
            )
            answer_div.parentNode.insertBefore(answer_div, prev_sib)
            number_ballot(question_id)
        }
    })
}

function move_down(answer_id, question_id) {
    ballot_change_made( function() {
        var answer_div = get_answer_div(answer_id)
        var next_sib = answer_div.nextSibling

        if(is_selected(answer_id, question_id) && next_sib != null && 
                !$("*").is(":animated")) {
            remove_tutorial_blocks()
            animate_div_move(answer_div, next_sib,
                function() {
                    handle_tutorial(TutorialInputEnum.DN_BTN)
                }
            )
            answer_div.parentNode.insertBefore(answer_div,
                next_sib.nextSibling)
            number_ballot(question_id)
        }
    })
}

function sel_unsel(answer_id, question_id) {
    ballot_change_made( function() {
        var answer_div = get_answer_div(answer_id)
        var sel_div = get_question_selected_div(question_id)
        var unsel_div = get_question_unselected_div(question_id)
        var from = null
        var to = null
        var tutorial_input = null

        if(!$("*").is(":animated")) {
            if( is_selected(answer_id, question_id) ) {
                from = sel_div
                to = unsel_div
                tutorial_input = TutorialInputEnum.REM_BTN
            } else {
                from = unsel_div
                to = sel_div
                tutorial_input = TutorialInputEnum.ADD_BTN
            }
            remove_tutorial_blocks()
            $(answer_div).slideUp(function() {
                to.insertBefore(answer_div, null)
                $(answer_div).slideDown(function() {
                    handle_tutorial(tutorial_input)
                })
                number_ballot(question_id)
            })
        }
    })
}

function validate_ballot() {
    ballot_change_made( function() {
        var form_entries = document.getElementById("constructed-form-entries")
        var validate = document.getElementById("verify-ballot-div-area")
        var some_answers = false

        form_entries.innerHTML = ""
        validate.innerHTML = ""

        for( var question in question_list ) {
            var question_id = question_list[question]
            var sel_div = get_question_selected_div(question_id)
            var desc_div = get_question_desc_div(question_id)

            var question_validate_div = document.createElement("div")
            question_validate_div.className = "poll_question"

            var question_validate_desc = document.createElement("div")
            question_validate_desc.innerHTML = desc_div.innerHTML
            question_validate_desc.classList = desc_div.classList
            question_validate_div.appendChild(question_validate_desc)

            if( sel_div.childNodes.length == 0 ) {
                var new_ans = document.createElement("div")
                new_ans.className = "poll_answer_desc"
                new_ans.innerHTML = "No choices selected"
                question_validate_div.appendChild(new_ans)
            }

            for( var i = 0; i < sel_div.childNodes.length; i++ ) {
                some_answers = true
                var selected_ans_node = sel_div.childNodes[i]

                var new_input = document.createElement("input")
                new_input.type = "hidden"
                new_input.name = selected_ans_node.id
                new_input.value = i + 1 
                form_entries.appendChild(new_input)

                var new_ans = document.createElement("div")
                new_ans.className = "poll_answer_desc"
                new_ans.innerHTML = "" + (i+1) + ". " +
                    get_answer_div_desc_div(selected_ans_node).innerHTML
                question_validate_div.appendChild(new_ans)
            }


            validate.appendChild(question_validate_div)
        }

        $("#check-ballot-btn").slideUp("fast")
        if_hidden_slide_down("#verify-ballot-area")
        if( some_answers ) {
            if_hidden_slide_down("#form", function()
                {handle_tutorial(TutorialInputEnum.SUBMIT_VIS);})
        }
    })
}

function toggle_visible_block(element_id) {
    var post_handle_func = function() {
        handle_tutorial(TutorialInputEnum.INFO_BTN);}

    remove_tutorial_blocks()
    if( $( "#" + element_id ).is(":hidden") ) {
        $( "#" + element_id ).slideDown("slow", post_handle_func)
    } else {
        $("#" + element_id ).slideUp("slow", post_handle_func)
    }
}

