function toggle_visible_block(element_id, might_change_tutorial) {
    /* Toggle the visibility of a block that might change the locations
     * of the tutorial messages
     *
     * Called in html by the instructions button
     */

    var post_handle_func = function() {
        if(might_change_tutorial === true) {
            handle_tutorial();
        }
    }

    if(might_change_tutorial === true) {
        remove_tutorial_blocks()
    }

    if( $( "#" + element_id ).is(":hidden") ) {
        $( "#" + element_id ).slideDown("slow", post_handle_func)
    } else {
        $("#" + element_id ).slideUp("slow", post_handle_func)
    }
}

