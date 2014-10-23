    "use strict";
    import MenuSelectProfile = require("./MenuSelectProfile");
    import React = require("react");
    var exp = React.createClass({
        displayName: "MenuComponent",
        getInitialState: function () {
            return this._getState();
        },
        propTypes:{
            model: React.PropTypes.object.isRequired,
        },

        getMenuItems: function () {
            // model is Menu here (menu is not like pages)
            var model = this.props.model;
            var router = this.props.router;
            var currentProfile = model.app.currentProfile;
            var dialogsMisc = null;
            if (currentProfile) {
                dialogsMisc = currentProfile.unreadCount ? " (" + currentProfile.unreadCount + ")" : null
            }
            return {
                "Documents": {
                    handler: router.createNavigateHandler("documents", currentProfile),
                    className: "menu-item"
                },
                "Dialogs": {
                    handler: router.createNavigateHandler("dialogs", currentProfile),
                    className: "menu-item",
                    misc: dialogsMisc
                },
                "Contacts": {
                    handler: router.createNavigateHandler("contacts", currentProfile),
                    className: "menu-item"
                },
                "Profile settings": {
                    handler: router.createNavigateHandler("profileSettings", currentProfile),
                    className: "menu-item last"
                },
                "Clear storage (temp)": {
                    handler: function () {
                        if(confirm("this will delete ALL KEYS AND MESSAGES!")){
                            window.fakeDb.clear().then(function(){
                                location.reload(true);    
                            });                                                    
                        }
                    },
                    className: "menu-item secondary"
                }
            };
        },
        _getState: function () {
            var model = this.props.model;
            return {
                profiles: model.getProfiles(),
                currentProfile: model.getCurrentProfile()
            };
        },
        handleSelectProfile: function (profile) {
            var model = this.props.model;
            model.setCurrentProfile(profile);
            this.props.router.navigate("home", model.app);
        },

        handleAddProfile: function () {
            var model = this.props.model;
            var np = model.addProfile();
            this.props.router.createNavigateHandler("profileSettings", np)();
            setTimeout(function(){
                // HACK
                $("div[data-id='profileName'] .editable-edit-button").click();
            }, 20);
            //this.props.router.navigate("home", model.app);
            return false;
        },

        _onModelChanged: function () { this.setState(this._getState()); },
        componentDidMount: function () {
            this.props.model.on("changed", this._onModelChanged, this);
            this.resendInterval = setInterval(function(){
                // EVEN LARGER HACK
                try{
                    this.setState({tmp: Math.random()});
                    this.state.currentProfile.transport._sendNextPacket()
                    }catch(e){
                        console.log(e);
                    }
                }.bind(this), 4000);
        },
        componentWillUnmount: function () {
            this.props.model.off("changed", this._onModelChanged, this);
            clearInterval(this.resendInterval);
        },
        getUnsent: function(){
            try{
                // HACK!!!!
                return ""+this.state.currentProfile.transport._unsentPackets.length;
            }catch(e){
                console.log(e);
                return "unknown";
            }
        },
        getNetstat: function(){
            try{
                // HACK!!!!
                var q = this.state.currentProfile.transport._polling;
                var instant = (+new Date());
                if(!q){
                    return "unknown";
                }
                var diff = "Network ";
                if(q._lastSuccess > q._lastError){
                        diff = diff + "OK, updated " + Math.floor((instant - q._lastSuccess)/1000) + " sec ago";
                }else if(q._lastError){
                    diff = diff + "OFFLINE";
                }else{
                        diff = diff + "probably OK";
                }
                return diff;
            }catch(e){
                console.log(e);
                return "unknown";
            }
        },
        render: function () {
            var menuItems = {}, items = this.getMenuItems(), title, item;
            for (title in items) {
                item = items[title];
                menuItems[title] = React.DOM.a({
                    href: "",
                    className: item.className,
                    onClick: item.handler
                }, title, items[title].misc);
            }
            var fc = (<any>window).fluxConfig;

            return React.DOM.div({className: this.props.className},
                (!this.state.profiles ? null : MenuSelectProfile({
                    className: "profile-selector",
                    profiles: this.state.profiles,
                    currentProfile: this.state.currentProfile,
                    selectProfile: this.handleSelectProfile,
                    addProfile: this.handleAddProfile
                })), menuItems, 
                    React.DOM.div(null, 
                        React.DOM.small(null, React.DOM.br(null), 
                            "HTML: 14." + fc.buildMonth + "." + fc.buildDay + "-" + fc.buildRevision, React.DOM.br(null),                            
                            "JS: 14." + fc.buildMonth2 + "." + fc.buildDay2 + "-" + fc.buildRevision2, React.DOM.br(null), 
                            (this.state.currentProfile) ? (this.state.currentProfile.serverUrl) : null),
                        React.DOM.small(null, React.DOM.br(null), "Unsent packets: ", this.getUnsent()),
                        React.DOM.small(null, React.DOM.br(null), "", this.getNetstat())
                    )
                );
        }
    });
export = exp;
