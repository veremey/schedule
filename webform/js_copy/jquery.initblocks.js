(function($) {
    $.fn.initBlocks = function() {
        return this.each(function() {
            var $blocks = $(this).find('[block]').add($(this).filter('[block]'));

            $blocks.each(function() {
                var plugin = $(this).attr('block'),
                    options = typeof this.onclick == 'function' ? this.onclick() : {};

                if (options.hasOwnProperty(plugin)){
                    options = options[plugin];
                }

                $(this)[$(this).attr('block')](options);
            });
        });
    };

    $(function() {
        $(document).initBlocks();
    })
})(jQuery);