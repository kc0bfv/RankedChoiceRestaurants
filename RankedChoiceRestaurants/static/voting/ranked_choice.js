function get_include_checkbox(answer_id) {
    return document.getElementById("include-answer-" + answer_id)
}

function get_answer_div(answer_id) {
    return document.getElementById("answer-" + answer_id)
}

function get_answer_rank_div(answer_id) {
    return document.getElementById("rank-answer-" + answer_id)
}

function get_question_div(question_id) {
    return document.getElementById("question-" + question_id)
}

function get_question_selected_div(question_id) {
    return document.getElementById("question-selected-" + question_id)
}

function get_question_unselected_div(question_id) {
    return document.getElementById("question-unselected-" + question_id)
}

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

function remove_tutorial_blocks() {
    var element_list = []
    do {
        for(var i = 0; i < element_list.length; i++) {
            document.body.removeChild(element_list[i])
        }
        element_list = document.body.getElementsByClassName("tutorial_child")
    } while( element_list.length > 0 )
}

var tutorial_state = 0
function handle_tutorial(up_or_dn_pressed) {
    /* This will manage the state changes for the tutorial
     * The overall diagram is:
     * State 0 - No items are selected. The initial tutorial text should get
     *      created.
     *      When up/down buttons are visible, transition to 1.
     * State 1 - Things have been added to the ballot, but no ratings have
     *      been manipulated.  Recommendation for rankings and removing.
     *      When the user has manipulated the rating for any item, state 2
     * State 2 - Same as state 1, but waiting for one more up/dn press
     *      When user presses a second button, go to 3
     * State 3 - Tutorial done.
     */

    var checkmark_help = "Use the checkmark to add options to your ballot!  Vote for any number of options."
    var up_dn_help = "Use the up and down arrows to reorder options to match your preferences.  Use the X button to remove options from your ballot."
    var state_text = [checkmark_help, up_dn_help, up_dn_help]

    // Determine if we should switch states...
    switch(tutorial_state) {
        case 0:
            // Count any visible up buttons (at least, taking up space)
            var up_btns = document.getElementsByClassName("poll_move_up")
            var up_vis_cnt = 0;
            for(var i = 0; i < up_btns.length; i++) {
                if($(up_btns[i]).is(":visible")) {
                    up_vis_cnt += 1
                }
            }
            if(up_vis_cnt >= 2) {
                tutorial_state = 1;
            }
            break
        case 1:
        case 2:
            // If the function was invoked due to an up/dn press...
            if(up_or_dn_pressed) {
                tutorial_state += 1;
            }
            break
        case 3:
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
    }
    
    remove_tutorial_blocks()

    // Add the new tutorial blocks
    for(var i = 0; i < next_to_list.length; i++) {
        build_tutorial_block(next_to_list[i], state_text[tutorial_state])
    }
}

// Run handle_tutorial as soon as the DOM is ready
$(document).ready(handle_tutorial)

function is_selected(answer_id, question_id) {
    var sel_div = get_question_selected_div(question_id)

    return get_answer_div(answer_id).parentNode == sel_div
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

function move_up(answer_id, question_id) {
    var answer_div = get_answer_div(answer_id)
    var prev_sib = answer_div.previousSibling

    if(is_selected(answer_id, question_id) && prev_sib != null && 
            !$("*").is(":animated")) {
        remove_tutorial_blocks()
        animate_div_move(answer_div, prev_sib,
            function() {
                handle_tutorial(true)
            }
        )
        answer_div.parentNode.insertBefore(answer_div, prev_sib)
        number_ballot(question_id)
    }
}

function move_down(answer_id, question_id) {
    var answer_div = get_answer_div(answer_id)
    var next_sib = answer_div.nextSibling

    if(is_selected(answer_id, question_id) && next_sib != null && 
            !$("*").is(":animated")) {
        remove_tutorial_blocks()
        animate_div_move(answer_div, next_sib,
            function() {
                handle_tutorial(true)
            }
        )
        answer_div.parentNode.insertBefore(answer_div,
            next_sib.nextSibling)
        number_ballot(question_id)
    }
}

function sel_unsel(answer_id, question_id) {
    var answer_div = get_answer_div(answer_id)
    var sel_div = get_question_selected_div(question_id)
    var unsel_div = get_question_unselected_div(question_id)
    var from = null
    var to = null

    if(!$("*").is(":animated")) {
        if( is_selected(answer_id, question_id) ) {
            from = sel_div
            to = unsel_div
        } else {
            from = unsel_div
            to = sel_div
        }
        remove_tutorial_blocks()
        $(answer_div).slideUp(function() {
            to.insertBefore(answer_div, null)
            $(answer_div).slideDown(function() {
                handle_tutorial(false)
            })
            number_ballot(question_id)
        })
    }

}

function build_form() {
    var form = document.getElementById("form")

    for( var question in question_list ) {
        var question_id = question_list[question]
        var sel_div = get_question_selected_div(question_id)
        for( var i = 0; i < sel_div.childNodes.length; i++ ) {
            var selected_ans_node = sel_div.childNodes[i]
            var new_input = document.createElement("input")
            new_input.type = "hidden"
            new_input.name = selected_ans_node.id
            new_input.value = i + 1 

            form.appendChild(new_input)
        }
    }

    return true
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

function toggle_visible_block(element_id) {
    if( $( "#" + element_id ).is(":hidden") ) {
        $( "#" + element_id ).slideDown("slow")
    } else {
        $("#" + element_id ).slideUp("slow")
    }
}

