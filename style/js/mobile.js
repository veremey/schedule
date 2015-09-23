jQuery.expr[':'].contains = function(a, i, m) {
    return jQuery(a).text().toLowerCase().indexOf(m[3].toLowerCase()) >= 0;
};

$.fn.delayKeyup = function(callback, ms){
    var timer = 0;
    var el = $(this);
    el.keyup(function(){
    clearTimeout (timer);
    timer = setTimeout(function(){
        callback(el)
        }, ms);
    });
    return $(this);
};

$(function(){
    $('form').submit(function(event){
        event.preventDefault();
    });

    var searchInput = $('#searchEntity');
    searchInput.focus();

    searchInput.delayKeyup(function(){
        var search = searchInput.val().toLowerCase();

        searchInput.attr('disabled', true);

        $('div.list-group .list-group-item').hide();
        $("div.list-group .list-group-item:contains('" + search + "')").show();

        searchInput.attr('disabled', false);
    }, 500);
});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}