var define;
define(['core', 'template!../../content/loginToolbarTemplate.html'], function (Core, LoginToolbarTemplate) {
    'use strict';
    
    
    return Core.View.extend({
        className: 'login-toolbar-view',
        
        domEvents: {
            'click #login-button'   : 'facebookLogin',
            'click #logout-button'  : 'facebookLogout'
        },
                            
        render: function (state) {
            LoginToolbarTemplate.renderToView(this, state);
        },
        
        facebookLogin: function () {
            //console.log('Logging In');
            this.trigger('facebook:login');
        },
        
        facebookLogout: function () {
            //console.log('Logging Out');
            this.trigger('facebook:logout');
        }
    });
});