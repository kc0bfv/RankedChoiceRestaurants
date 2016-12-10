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

function is_selected(answer_id, question_id) {
    var sel_div = get_question_selected_div(question_id)

    return get_answer_div(answer_id).parentNode == sel_div
}

function animate_div_move(src_div, dst_div, end_callback) {
    animate_div = document.createElement("div")
    animate_div.innerHTML = src_div.innerHTML
    animate_div.classList.add("poll_answer")
    animate_div.classList.add("answer_moving")
    animate_div.style.position="fixed"

    src_bounding = src_div.getBoundingClientRect() 
    animate_div.style.top = src_bounding.top + "px"
    animate_div.style.left = src_bounding.left + "px"
    animate_div.style.height = src_bounding.height + "px"
    animate_div.style.width = src_bounding.width + "px"

    animate_div.style.background = "white"

    document.body.appendChild(animate_div)

    dest_top = dst_div.getBoundingClientRect().top + "px"
    dest_left = dst_div.getBoundingClientRect().left + "px"
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
        animate_div_move(answer_div, prev_sib,
            function() {
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
        animate_div_move(answer_div, next_sib,
            function() {
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
        $(answer_div).slideUp(function() {
            to.insertBefore(answer_div, null)
            $(answer_div).slideDown()
            number_ballot(question_id)
        })
    }

}

function build_form() {
    var form = document.getElementById("form")

    for( var question in question_list ) {
        question_id = question_list[question]
        var sel_div = get_question_selected_div(question_id)
        for( var i = 0; i < sel_div.childNodes.length; i++ ) {
            selected_ans_node = sel_div.childNodes[i]
            new_input = document.createElement("input")
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
        selected_ans_node = sel_div.childNodes[i]
        ans_rank = document.getElementById("rank-"+selected_ans_node.id)
        ans_rank.innerHTML = i + 1
    }

    for( var i = 0; i < unsel_div.childNodes.length; i++ ) {
        unselected_ans_node = unsel_div.childNodes[i]
        ans_rank = document.getElementById("rank-"+unselected_ans_node.id)
        ans_rank.innerHTML = "&nbsp;"
    }
}

function toggle_visible_block(element_id) {
    // Non- jQuery way...
    /*
    element = document.getElementById(element_id)
    if( element.style.display == "none" || element.style.display == "" ) {
        element.style.display = "block"
    } else {
        element.style.display = "none"
    }
    */
    // j-Query way...
    if( $( "#" + element_id ).is(":hidden") ) {
        $( "#" + element_id ).slideDown("slow")
    } else {
        $("#" + element_id ).slideUp("slow")
    }
}
