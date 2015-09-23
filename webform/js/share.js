$.widget("block.share", {

    _create: function() {
        var block = this,
            $block = this.element;

        block.options = $block.data('options');

        block.$button = $block.find('.share__label');
        block.$content = $block.find('.share__content');

        block.$vkontakte = $block.find('.share__item_vk');
        block.$facebook = $block.find('.share__item_facebook');
        block.$twitter = $block.find('.share__item_twitter');

        // обновляем счетчики для каждой из кнопок
        for (var key in block.options) {
            block[key]();
        }

        // открываем окно при клике на кнопку
        block.$button.on('click', function() {
            var $bttn = $(this),
                $shareCount = $(this).closest('.share__item').find('.share__count'),
                count = parseInt($shareCount.text());

            if(!isNaN(count) && !$bttn.data('params').clicked) {
                count++;
                $shareCount.html(count);
                $.extend($bttn.data('params'), {
                    'clicked': true
                });
            }

            // todo: попробовать делать это в iframe
            window.open($bttn.attr('href'),'displayWindow', 'width=700, height=400, left=200, top=100, location=no, directories=no, status=no, toolbar=no, menubar=no');
            return false;
        });

        // фиксируем блок при прокрутке страницы
//        $(window).on('scroll', function(){
//            if ($(window).scrollTop() > $block.offset().top - 10) {
//                block.$content.addClass('share__content_fixed');
//            } else {
//                block.$content.removeClass('share__content_fixed');
//            }
//        });

    },

    vk: function() {
        var block = this,
            url = window.location.protocol + '//' + window.location.hostname + '/';

        VK = {};
        VK.Share = {};
        VK.Share.count = function(index, count){
            block.$vkontakte.find('.share__count').html(count);
        };
        $.getJSON('//vkontakte.ru/share.php?act=count&index=1&url=' + url + '&format=json&callback=?');
    },

    fb: function() {
        var block = this,
            url = window.location.protocol + '//' + window.location.hostname + '/';

        $.getJSON('//api.facebook.com/restserver.php?method=links.getStats&callback=?&urls=' + url + '&format=json', function(data) {
            block.$facebook.find('.share__count').html(data[0].share_count);
        });
    },

    tw: function() {
        var block = this,
            url = window.location.protocol + '//' + window.location.hostname + '/';

        $.getJSON('//urls.api.twitter.com/1/urls/count.json?url=' + url + '&callback=?', function(data) {
            block.$twitter.find('.share__count').html(data.count);
        });
    }

});
