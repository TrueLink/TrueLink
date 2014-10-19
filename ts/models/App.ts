"use strict";
import invariant = require("../modules/invariant");
import extend = require("tools/extend");
import Event = require("tools/event");
import serializable = require("../modules/serialization/serializable");
import CouchTransport = require("models/tlConnection/CouchTransport");
import Profile = require("models/Profile");
import fixedId = require("mixins/fixedId");
import Model = require("tools/model");
import urandom = require("../modules/urandom/urandom");
import notifications = require("tools/notifications-api");


var maxBgIndex = 3;

export class Application extends Model.Model implements ISerializable {
    public transport : CouchTransport.CouchTransport;
    public random : any;
    public menu : any;
    public profiles : Array<Profile.Profile>;
    public currentProfile : Profile.Profile;
    public router : any;
    public defaultPollingUrl : string;
    public fixedId : string;
    public title : string;
    private lastUnreadObjectsCount : number;

    constructor () {
            super();

            this.title = "TrueLink άλφα";

        this.fixedId = Application.id;
        this.transport = null;
        this.random = null;
        this.menu = null;
        this.profiles = [];
        this.currentProfile = null;
        this.router = null;
        this.lastUnreadObjectsCount = -1;
        this.defaultPollingUrl = (<any>window).fluxConfig.defaultPollingUrl;
    }
    
    public static id: string = "0BF08932-8384-47B3-8554-6FEC3C2B158D";

        serialize  (packet, context) {
            packet.setData({});
            packet.setLink("transport", context.getPacket(this.transport));
            packet.setLink("profiles", context.getPacket(this.profiles));
            packet.setLink("currentProfile", context.getPacket(this.currentProfile));
            packet.setLink("menu", context.getPacket(this.menu));
            packet.setLink("router", context.getPacket(this.router));
            packet.setLink("random", context.getPacket(this.random));

        }
        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            this.random = context.deserialize(packet.getLink("random"), factory.createRandom, factory);
            this.profiles = context.deserialize(packet.getLink("profiles"), factory.createProfile, factory);
            this.currentProfile = context.deserialize(packet.getLink("currentProfile"), factory.createProfile, factory);
            this.profiles.forEach(function(p){
                this.watchProfileUnreadObjects(p);
            }, this);

            try {
                this.setMenu(context.deserialize(packet.getLink("menu"), factory.createMenu, factory));
            } catch (ex) {
                console.error(ex);
                this.setMenu(this.getFactory().createMenu());
            }

            try {
                this.setRouter(context.deserialize(packet.getLink("router"), factory.createRouter, factory));
            } catch (ex) {
                console.error(ex);
                this.setRouter(this.getFactory().createRouter());
                this.router.navigate("home", this);
            }
            this._updateAppTitle();
        }


        setMenu  (menu) {
            if (this.menu) {
                menu.onCurrentProfileChanged.off(this.setCurrentProfile, this);
                menu.onAddProfile.off(this.addProfile, this);
            }

            if (menu) {
                menu.onCurrentProfileChanged.on(this.setCurrentProfile, this);
                menu.onAddProfile.on(this.addProfile, this);
            }
            // TODO: not sure if it helps
            menu.setApp(this);

            this.menu = menu;
        }

        setRouter  (router) {
            if (this.router) {
                this.router.off("changed", this._onChanged, this);
            }
            if (router) {
                router.on("changed", this._onChanged, this);
            }
            this.router = router;
        }

        init  () {
            this.checkFactory();
            var factory = this.getFactory();
            console.log("app init");
            this.random = factory.createRandom();

            this.setMenu(factory.createMenu());
            this.setRouter(factory.createRouter());
            this.addProfile();
            this.router.navigate("home", this);

        }

        getProfiles  () {
            return this.profiles;
        }

        getCurrentProfile  () {
            return this.currentProfile;
        }
        setCurrentProfile  (profile) {
            this.currentProfile = profile;
            this._onChanged();
        }

        _getNextBgIndex  () {
            var nextBgIndex = 0;
            this.profiles.forEach(function (profile) {
                if (profile.bg >= nextBgIndex) { nextBgIndex = profile.bg + 1; }
                if (nextBgIndex > maxBgIndex) { nextBgIndex = 0; }
            });
            return nextBgIndex;
        }

        getTotalUnreadObjectsCount () : number {
            var total = 0;
            this.profiles.forEach(function (p) {
                total += p.unreadCount;
            });
            return total;
        }

        _updateAppTitle(){
            var total = this.getTotalUnreadObjectsCount();
            if (this.lastUnreadObjectsCount != total) {
                this.lastUnreadObjectsCount = total;
                //if(total > 9) total = 9;
                //var totalString = String.fromCharCode(10121 + total) + " "; // ➊ - too small
                var totalString = "(" + total + ") ";
                (total != 0) ? (document.title = totalString + this.title) : (document.title = this.title);
            }
        }

        watchProfileUnreadObjects (profile) {
            profile.onChanged.on(function () {
                this._updateAppTitle();
            }, this);
        }

        addProfile  () {
            var profile = this.getFactory().createProfile();
            this.watchProfileUnreadObjects(profile);
            var name = urandom.name();
            if (this.profiles.length == 0 && window.location.hash.match(/#nickname=([^&]*)/)) {
                try {
                    var cand = decodeURIComponent(window.location.hash.match(/#nickname=([^&]*)/)[1]);
                    if (cand.length >= 3) {
                        name = cand;
                        window.location.hash = "";
                    }
                } catch (e) { }
            }
            profile.init({
                name: name,
                bg: this._getNextBgIndex(),
                serverUrl: this.defaultPollingUrl
            });
            this.currentProfile = profile;
            this.profiles.push(profile);
            this._onChanged();
            return profile;
        }

    };

extend(Application.prototype, serializable, fixedId);

