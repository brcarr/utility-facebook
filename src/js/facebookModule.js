var define;
define(['core', './views/mainView', 'psw-framework-application-context', 'facebook', 'logger'], function (Core, MainView, ApplicationContext, Facebook, Logger) {
    'use strict';
    
    return Core.Module.extend({
        
        initialize: function () {
            Facebook.init({
                appId       : '762518430521626',
                cookie      : true,
                version     : 'v2.5'
            });
            
            this.mainView = new MainView();
            
            //Read config.json to get settings for contextSearch
            var packageSettings = Core.App.config.applicationContextSettings || {};
            this.applicationContextConfig = packageSettings.facebook || {};
            this.contextSources = this.applicationContextConfig.contextSources || '';
        },
        
        mianView: null,
        path: 'facebook',
        urlParts: null,
        
        icon: {
            className: 'icon-facebook',
            text: Core.Strings.translate('facebook.title')
        },
        
        routes: {
            '': 'home'
        },
        
        connected: function () {
            this.listenTo(ApplicationContext.Manager, 'change:context', this.contextSearch);
        },
                
        contextSearch: function (data) {
            if (this.mainView.state.fbUser) { // Only run the contextSearch if user is currenty logged into Facebook
                var source = data.context.source.type, searchString, valueFound, searchValue;
                
                // Determine approrpiate searchStringValue to use based on 'source'
                if (source) {
                    valueFound = false;
                    searchValue = this.contextSources[source];
                    if (searchValue) {
                        searchString = data.context.properties[searchValue];
                        if (!searchString) {
                            Logger.log('No matching properties for ' + data.context.source.type, Logger.WARNING, Logger.GENERAL);
                            return;
                        }
                        valueFound = true;
                    }
                    
                    if (!valueFound) {
                        Logger.log('Unable to locate contextSource settings for ' + data.context.source.type, Logger.WARNING, Logger.GENERAL);
                        return;
                    }
                } else {
                    Logger.log('No context source settings found in config.json', Logger.ERROR, Logger.GENERAL);
                    return;
                }
                
                this.mainView.setState({ searchString: searchString, searchSource: 'context', context: data.context });
            }
        },
        
        home: function () {
            this.$element.html(this.mainView.render().$element);
        }
    });
});