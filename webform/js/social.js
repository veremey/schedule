
/**
 * http://raspisaniye-vuzov.ru/
 * 
 * @version 1.0
 */

var social_links = {
    
    /**
     * Параметры
     *
     */
    options: {
        icons: [
            {
                icon: '/webform/image/vk.png',
                title: 'Вконтакте',
                link: 'https://vk.com/raspisanievuzov'
            },
            {
                icon: '/webform/image/facebook.png',
                title: 'Facebook',
                link: 'https://www.facebook.com/vuzarium'
            },
            {
                icon: '/webform/image/twitter.png',
                title: 'Twitter',
                link: 'https://twitter.com/raspisanievuzov'
            },
            {
                icon: '/webform/image/habrahabr.png',
                title: 'ХабраХабр',
                link: 'http://habrahabr.ru/company/raspisanie/'
            }
        ],
        close_icon: '/assets/template/webform/image/cancel.png',
        delay: 30 * 1000,//задержка 30 секунд
        repeat_days: 10//повтор через 10 дней
    },
    timer: null,
    
    /**
     * Инициализация
     *
     */
    init: function(){
        
        if ( this.isMobile() ) {
            return;
        }
        
        var self = this;
        
        var viewed = this.getCookie('rv_social_viewed');
        
        if( !viewed  ){
            
            clearTimeout( self.timer );
            self.timer = setTimeout( function(){ self.showWindow(); }, self.options.delay );
            
        }
        
    },
    
    /**
     * Установка кук
     *
     */
    setCookie: function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
    },
    
    /**
     * Чтение кук
     *
     */
    getCookie: function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    },
    
    /**
     * Показ окна
     *
     */
    showWindow: function(){
        
        var self = this;
        
        var window_html = '<div class="modal" id="socialLinksWindow" style="position: absolute; left: 50%; top: 50%; width: 480px; min-height: 260px; margin: -130px 0 0 -240px; text-align:center; padding: 20px; background-color:#fff; font-size: 20px; color: #3A5382; z-index: 1010; text-shadow: none;">\
        <a href="#" class="btn-cancel" style="position: absolute; right: 15px; top: 15px;"><img src="' + self.options.close_icon + '"></a>\
        <div style="padding: 20px 0;">&laquo;Расписание вузов&raquo; в социальных сетях:</div>\
        <div style="padding: 20px 0;">' + "\n";
        
        for( var i = 0; i < self.options.icons.length; i++ ){
            window_html += '<a href="' + self.options.icons[i].link + '" target="_blank"><img src="' + self.options.icons[i].icon + '" alt="' + self.options.icons[i].title + '" title="' + self.options.icons[i].title + '" /></a>';
            window_html += "&nbsp;\n";
        }
        
        window_html += '<div style="padding: 20px 0; font-style:italic; color: #FF3256;">Присоединяйтесь!</div>\
        <div style="padding: 20px 0; font-size: 16px;"><a href="#" class="btn-already" style="color: #3A5382; text-decoration: none; border-bottom: 1px dashed #3A5382;">Спасибо, я уже с вами</a></div>\
        </div></div>';
        
        $(document.body).append( window_html );
        
        $('#socialLinksWindow a.btn-cancel')
        .unbind( 'click' )
        .bind( 'click', self.closeWindow );
        
        $('#socialLinksWindow .btn-already').bind( 'click', self.alreadyAction );
        
        if ( $('.modal-overlay').size() == 0 ) {
            $(document.body).append( '<div class="modal-overlay" style="position: fixed; left: 0; top:  0; width: 100%; height: 100%; z-index: 999; background: rgba(0,0,0,.7);"></div>' );
            $('.modal-overlay')
            .bind( 'click', self.closeWindow );
        }
        
        $('#socialLinksWindow,.modal-overlay').show();
        $(window).scrollTop(0);
        
        self.setCookie( 'rv_social_viewed', '1', self.options.repeat_days );
        
    },
    
    /**
     * Закрытие окна
     *
     */
    closeWindow: function(){
        $('.modal-overlay').hide();
        $('.modal').hide();
        return false;
    },
    
    /**
     * Если уже присоединился, ставим куку на год и закрываем окно
     *
     */
    alreadyAction: function(){
        
        social_links.setCookie( 'rv_social_viewed', '1', 365 );
        
        social_links.closeWindow();
        return false;
    },
    
    /**
     * Определение мобильного по разрешению экрана
     *
     */
    isMobile: function(){
        return jQuery.browser.mobile;
    }
    
}

$(document).bind('ready',function(){
    social_links.init();
});

//http://detectmobilebrowsers.com/
(function(a){(jQuery.browser=jQuery.browser||{}).mobile=/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);
