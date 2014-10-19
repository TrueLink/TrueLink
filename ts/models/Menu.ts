    "use strict";
    import invariant = require("../modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import serializable = require("../modules/serialization/serializable");
    import Model = require("tools/model");
    import Application = require("models/App");
    import Profile = require("models/Profile");
    import fixedId = require("mixins/fixedId");
    import bind = require("mixins/bind");

    export class Menu extends Model.Model implements ISerializable {
        public fixedId : string;
        public onCurrentProfileChanged : Event.Event<any>;
        public onAddProfile : Event.Event<any>;
        public app : Application.Application;

        constructor () {
            super();
        this.fixedId = "0D7F92D8-8047-4E37-8E55-BCB009D541C8";
        this.onCurrentProfileChanged = new Event.Event<any>("Menu.onCurrentProfileChanged");
        this.onAddProfile = new Event.Event<any>("Menu.onAddProfile");
        this.app = null;
    }

        setApp  (app) {
            if (this.app) {
                this.app.onChanged.off(this._onAppChanged, this);
            }
            app.onChanged.on(this._onAppChanged, this);
            this.app = app;
        }
        serialize  (packet, context) {

        }
        deserialize  (packet, context) {

        }

        getCurrentProfile  () {
            this._checkApp();
            return this.app.getCurrentProfile();
        }

        setCurrentProfile  (profile) {
            this.onCurrentProfileChanged.emit(profile);
        }

        getProfiles  () {
            this._checkApp();
            return this.app.getProfiles();
        }

        addProfile  () {
            this._checkApp();
            return this.onAddProfile.emit(null);
        }

        _checkApp  () {
            invariant(this.app, "app is not set");
        }

        _relinkProfile  (profile) {
            profile.onChanged.off(this._onChanged, this);
            profile.onChanged.on(this._onChanged, this);
        }

        _onAppChanged  () {
            this.app.profiles.forEach(this._relinkProfile, this);
            // everything will be reconstructed anyway on app "changed"
            this._onChanged();
        }
    };
extend(Menu.prototype, serializable, fixedId, bind);
