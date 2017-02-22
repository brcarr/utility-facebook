var define;
define(['core', 'controls', 'template!../../content/searchToolbarTemplate.html'], function (Core, Controls, SearchToolbarTemplate) {
    'use strict';
    
    return Core.View.extend({
        className: 'search-toolbar-view',
        
        domEvents: {
            'click .primary' : 'facebookNameSearch',
            'keypress .search-input' : 'searchOnEnter'
        },
        
        initialize: function () {
            this.state = {
                searchString: null
            };
        },
        
        render: function () {
            SearchToolbarTemplate.renderToView(this, this.state);
        },
        
        setState: function (newState) {
            this.state.searchString = newState.searchString;
            this.render();
        },
        
        facebookNameSearch: function () {
            var data = document.getElementById('facebook-search-input'),
                alert;
            if (data.value) {
                this.state.searchSource = 'manual';
                //this.trigger('facebook:nameSearch', data.value); // maybe I should be passing in an object here with the searchString AND the searchSource (e.g. { searchString: data.value, searchSource: 'manual' })
                this.trigger('facebook:nameSearch', { searchString: data.value, searchSource: 'manual' });
            } else {
                alert = new Controls.Alert({
                    message: 'Please enter a search value',
                    type: 'info',
                    displayTimeout: 3000
                });
                alert.getElement().prependTo(this.element);
                alert.show();
                return;
            }
        },
        
        searchOnEnter: function (e) {
            if (e.which === 13) {
                this.facebookNameSearch();
            }
        }
    });
});