var define, console;
define([
    'jquery',
    'core',
    'controls',
    './loginToolbarView',
    './searchToolbarView',
    './searchResultsView',
    'psw-framework-notifications',
    'template!../../content/mainView.html',
    'template!../../content/contextCard.html',
    'logger',
    'facebook'
], function ($, Core, Controls, LoginToolbarView, SearchToolbarView, SearchResultsView, Notifications, MainViewTemplate, ContextCardTemplate, Logger, Facebook) {
    'use strict';
        
    return Core.View.extend({
        className: 'main-view',
        
        initialize: function () {
            
            // Create this.state object that will be used to control current state of the app
            this.state = {
                fbUser: null,
                searchResults: [],
                searchString: null,
                searchSource: null,
                context: null,
                isLoading: null
            };
            
            // Get the current Facebook login status and login if necessary
            Facebook.getLoginStatus(function (response) {
                var status = response.status;
                if (status !== 'connected') {
                    Logger.log('Not connected to Facebook.', Logger.INFO, Logger.GENERAL);
                    if (!this.loginToolbarView) {
                        this.loginToolbarView = new LoginToolbarView(this.state);
                    }
                    
                    this.loginToolbarView.render(this.state);
                } else if (status === 'connected') {
                    this.state.fbUser = {
                        id: response.authResponse.userID,
                        accessToken: response.authResponse.accessToken
                    };
                    this.getFacebookUserProfile();
                }
            }.bind(this));
            
            if (!this.loginToolbarView) {
                this.loginToolbarView = new LoginToolbarView(this.state); // Create instance of Login Toolbar View
            }
            this.searchToolbarView = new SearchToolbarView(this.state); // Create instance of Search Toolbar View
            this.searchResultsView = new SearchResultsView(this.state); // Create instance of Search Results View
            
            // Listen for events from nested views
            this.listenTo(this.loginToolbarView, 'facebook:login', this.facebookLogin);
            this.listenTo(this.loginToolbarView, 'facebook:logout', this.facebookLogout);
            this.listenTo(this.searchToolbarView, 'facebook:nameSearch', this.facebookNameSearch);
        },
        
        // Performs Facebook Graph API user search based on name provided, then loops through search results to get details for each returned FB user
        facebookNameSearch: function (data) {
            // Update searchResultsView to show 'isLoading' state
            this.state.isLoading = true;
            this.searchResultsView.render(this.state);
            this.searchResultsView.showBusyStatus();
            
            this.state.searchString = data.searchString;
            this.state.searchSource = data.searchSource;
            this.state.context = data.context;
            
            // If the search was initiated from context:change event, add Notification
            if (this.state.searchSource === 'context') {
                this.contextCard = $('<div class="card"></div>');
                this.notification = Notifications.NotificationsSystem.addNotification(this.state.context, this.contextCard);
                this.notification.state = 'loading';
            }
            
            // Perform the Facebook Graph API search, passing in the searchString
            Logger.log('Performing Facebook search for: ' + this.state.searchString, Logger.VERBOSE, Logger.GENERAL);
            
            Facebook.api('/search', 'GET', { 'q': this.state.searchString, 'type': 'user' }, function (response) {
                if (response.error) {
                    Logger.log(response.error.message, Logger.ERROR, Logger.GENERAL);
                    return;
                } else if (!response.data.length) {
                    this.state.isLoading = false;
                    this.state.searchResults = null;
                    this.searchResultsView.render(this.state);
                    Logger.log('No results found for ' + this.state.searchString, Logger.INFO, Logger.GENERAL);
                    if (this.state.searchSource === 'context') {
                        this.contextCard.html(ContextCardTemplate.render(this.state));
                        this.notification.state = 'no-content';
                    }
                    this.createContextCard(this.state); // Will create a card that says no results were found
                    return;
                }
                var users = response.data;
                this.state.searchResults = [];
                this.state.searchResults.length = 0;
                users.forEach(function (user) { // Loop through list of users, get additional data fields for each, and push to this.state.searchResults array
                    Facebook.api("/" + user.id, { fields: 'name, last_name, first_name, picture, location' }, function (personResponse) {
                        if (personResponse.error) {
                            Logger.log(personResponse.error.message, Logger.ERROR, Logger.GENERAL);
                            return;
                        }
                        var obj = {
                            id: personResponse.id,
                            name: personResponse.name,
                            last_name: personResponse.last_name,
                            first_name: personResponse.first_name,
                            picture: personResponse.picture.data.url,
                            location: personResponse.location
                        };
                        this.state.searchResults.push(obj);
                        if (this.state.searchResults.length === users.length) { // When all searchResults are loaded, render the results into searchResultsView and create context card
                            Logger.log('Facebook users found: ' + this.state.searchString + ' (' + this.state.searchResults.length + ')', Logger.INFO, Logger.GENERAL);
                            this.render(this.state);
                            this.state.isLoading = false;
                            this.searchResultsView.render(this.state);
                            this.createContextCard(this.state);
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },
        
        // Renders or removes the context card to/from the Notifications UI
        createContextCard: function (cardData) {
            if (this.state.searchSource === 'context' && this.state.searchResults) { // Only render the card if the search was initiated from context:change event
                this.contextCard.html(ContextCardTemplate.render(cardData));
                this.notification.state = 'has-content';
            } else if (this.notification) {
                this.notification.remove(); // Otherwise remove the notification from the UI
            }
        },
        
        // Performs FB Login function and renders LoginToolbarView and SearchToolbarView, then shows SearchToolbarView and SearchResultsView.
        facebookLogin: function () {
            Facebook.login(function (response) {
                if (response.status === 'unknown') { return; } // User clicks the 'Cancel' button on login dialog
                this.state.fbUser = {
                    id: response.authResponse.userID
                };
                this.getFacebookUserProfile();
                this.loginToolbarView.render(this.state);
                this.searchToolbarView.render();
                this.searchToolbarView.$element.show();
                this.searchResultsView.$element.show();
            }.bind(this));
        },
        
        // Performs FB logout function, re-renders the LoginToolbarView, then hides SearchToolbarView and SearchResultsView.
        facebookLogout: function () {
            Facebook.logout(function (response) {
                this.state.fbUser = null;
                this.loginToolbarView.render(this.state);
                this.searchToolbarView.$element.hide();
                this.searchResultsView.$element.hide();
            }.bind(this));
            
            Logger.log('No Facebook Connection.', Logger.INFO, Logger.GENERAL);
        },
        
        // Gets additional details for the currently logged in FB user, re-renders LoginToolbarView, the renders SearchToolbarView.
        getFacebookUserProfile: function () {
            Facebook.api('/me', {fields: ['name', 'first_name', 'picture']}, function (response) {
                this.state.fbUser = {
                    id: response.id,
                    name: response.name,
                    first_name: response.first_name,
                    picture: response.picture.data.url
                };
                Logger.log('Currently logged into Facebook as: ' + this.state.fbUser.name, Logger.VERBOSE, Logger.GENERAL);
                this.loginToolbarView.render(this.state);
                this.render(this);
            }.bind(this));
            
            this.searchToolbarView.render(this.state);
        },
        
        render: function () {
            if (!this.$element.html()) { //if it hasn't already been rendered
                this.$element.html(MainViewTemplate.renderToView(this));
                this.$('.login-toolbar-view').html(this.loginToolbarView.element);
                this.$('.search-toolbar-view').html(this.searchToolbarView.element);
                this.$('.search-results-view').html(this.searchResultsView.element);
            }
            
            if (this.state.searchString) {
                this.searchToolbarView.setState({ searchString: this.state.searchString });
            }
            
            return this;
        },
        
        // Function used to update the current state        
        setState: function (newState) {
            if (newState.searchString) {
                this.facebookNameSearch({ searchString: newState.searchString, searchSource: newState.searchSource, context: newState.context});
            }
            
            this.render(this);
        }
    });
});