var define;
define(['core', 'controls', 'template!../../content/searchResultsTemplate.html'], function (Core, Controls, SearchResultsTemplate) {
    'use strict';
    
    return Core.View.extend({
        className: 'search-results-view',
        
        render: function (data) {
            if (this.progressIndicator) { this.progressIndicator.close(); } // Turn off the progress indicator before rendering search results to view
            SearchResultsTemplate.renderToView(this, data);
        },
        
        // Function used to create progress indicator and display it in searchResults view
        showBusyStatus: function () {
            this.progressIndicator = Controls.ProgressIndicator.show({
                parent: this.element
            });
        }
    });
});