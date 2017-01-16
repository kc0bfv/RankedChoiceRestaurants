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

function get_verify_ballot_div() {
    return dom_lookup("verify-ballot-area", "")
}

function get_submit_button() {
    return dom_lookup("submit-btn", "")
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
    /* Return true if an answer belonging to a question is selected
     */
    var sel_div = get_question_selected_div(question_id)

    return get_answer_div(answer_id).parentNode == sel_div
}





// ----------- Less-General Helper Functions ----------- 
function build_tutorial_block(next_to_element, tut_text) {
    /* Display a tutorial block
     */
    if($(next_to_element).is(":visible")) {
        var max_tut_width = "150" // Just a magic number for look
        var tut_border_add = 10 // In css, border is about this width...
        
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

function ballot_change_made(func_after) {
    /* Handle visual changes necessary after a change on the ballot
     */
    $("#check-ballot-btn").slideDown("fast", function() {
        $("#form").slideUp("fast", function() {
            $("#verify-ballot-area").slideUp("fast", function() {
                handle_tutorial()
                if(func_after !== undefined) {
                    func_after()
                }
            })
        })
    })
}

function number_ballot(question_id) {
    /* Number the selected ballot options for a given question
     */
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
function handle_tutorial() {
    /* Display the tutorial blocks
     */
    remove_tutorial_blocks()

    var TutorialQuestionState = Object.freeze(
        {ADD:0, REORDER:1, VERIFY:2, SUBMIT:3, NONE:4})

    var add_help = "Drag one or more options into the &quot;selected&quot; area to vote for them."
    var reorder_help = "Reorder options to match your preferences, or remove items you no longer wish to vote for."
    var nochoices_help = "Make voting selections above before verifying your ballot."
    var submit_help = "Verify your preferences.  Make changes above if necessary. Submit when you&apos;re ready."
    var state_text_map = [add_help, reorder_help, nochoices_help, submit_help]

    // Display one tutorial block per question
    for( var question in question_list ) {
        var question_id = question_list[question]
        var sel_div = get_question_selected_div(question_id)
        var unsel_div = get_question_unselected_div(question_id)
        var q_state = 0;
        var next_to = sel_div;

        if( sel_div.childNodes.length < 2 ) {
            q_state = TutorialQuestionState.ADD
            next_to = unsel_div
        } else {
            q_state = TutorialQuestionState.REORDER
            next_to = sel_div
        }
        build_tutorial_block(next_to, state_text_map[q_state])
    }
    
    var verify_ballot_div = get_verify_ballot_div()
    var submit_btn = get_submit_button()

    // Default these two to the verify state - if it's not visible,
    // build_tutorial_block won't display it...
    var ver_state = TutorialQuestionState.VERIFY
    var ver_next_to = verify_ballot_div

    if( $(submit_btn).is(":visible") ) {
        ver_state = TutorialQuestionState.SUBMIT
    }

    build_tutorial_block(ver_next_to, state_text_map[ver_state])
}

function remove_tutorial_blocks() {
    /* Clear all tutorial blocks from the screen
     */
    var element_list = []
    do {
        for(var i = 0; i < element_list.length; i++) {
            document.body.removeChild(element_list[i])
        }
        element_list = document.body.getElementsByClassName("tutorial_child")
    } while( element_list.length > 0 )
}

$(document).ready( function() {
    // Run handle_tutorial as soon as the DOM is ready
    handle_tutorial()

    // Make the questions sortable, but don't allow sorting between questions
    for( var question in question_list ) {
        var question_id = question_list[question]
        var sel_div = get_question_selected_div(question_id)
        var unsel_div = get_question_unselected_div(question_id)
        var desc_div = get_question_desc_div(question_id)

        // What I do with update down there is weird - I create a function
        // that returns a function then call it.  That results in creating
        // a new scoping specifically for local_question_id
        $(sel_div).sortable({
            placeholder: "poll_answer_placeholder",
            connectWith: "#" + unsel_div.id,
            update: function() {
                var local_question_id = question_id
                return function(event, ui) {
                        number_ballot(local_question_id)
                        ballot_change_made()
                    }
            }(),
            // Whenever receive happense on the selected div,
            // update happens too.  No need to duplicate things...
            /*receive: function(event, ui) {
                ballot_change_made()
            },*/
        })
        $(unsel_div).sortable({
            placeholder: "poll_answer_placeholder",
            connectWith: "#" + sel_div.id,

            receive: function(event, ui) {
                ballot_change_made()
            },
        })
    }
} )




// ----------- Functions Referenced In HTML ----------- 
function validate_ballot() {
    /* Occurs when the "validate ballot" button is pressed
     */
    var form_entries = document.getElementById("constructed-form-entries")
    var validate = document.getElementById("verify-ballot-div-area")
    var some_answers = false

    form_entries.innerHTML = ""
    validate.innerHTML = ""

    // Build the validation view and the response form for each question
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

    if( some_answers ) {
        $("#form").show()
    } else {
        $("#form").hide()
    }

    $("#check-ballot-btn").slideUp("fast")
    toggle_visible_block("verify-ballot-area", true)
}
