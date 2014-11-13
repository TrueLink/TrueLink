"use strict";
import modules = require("modules");
var invariant = modules.invariant;
import extend = require("../tools/extend");
import Event = require("../tools/event");
var serializable = modules.serialization.serializable;
import Model = require("../tools/model");
var urandom = modules.urandom.urandom;

import TlecBuilder = require("TlecBuilder");

export class ProfileSyncBuilder extends Model.Model implements ISerializable {

    public onDone : Event.Event<Profile>;
    public offer : any;
    public auth : any;

    private _tlec : any;

    constructor () {
        super();

        this.onDone = new Event.Event<Profile>("ProfileSyncBuilder.onDone");
        this.offer = null;
        this.auth = null;
        this._tlec = null;
        this._isTlecFinished = false;
    }

    init  () {
        this._tlec = this.getFactory().createCouchTlec();
        this._linkInitial();
        this._tlec.init();
        this._onChanged();
    }

    run  () {
        if (this._tlec) {
            this._tlec.run();
        }
    }

    _linkFinished() {
        this._tlec.on("message", this._receiveMessage, this);
    }

    _link() {
        this._tlec.on("changed", this._onChanged, this);
        if(_isTlecFinished) {
            this._linkFinished();
        } else {
            this._tlec.on("done", this._onTlecBuilderDone, this);
        }
    }

    enterOffer  (offer) {
        this._tlec.enterOffer(offer);
    }

    enterAuth  (auth) {
        this._tlec.enterAuth(auth);
    }

    serialize  (packet, context) {

        packet.setData({
        });

        packet.setLink("_tlec", context.getPacket(this._tlec));
    }

    deserialize  (packet, context) {
        this.checkFactory();
        var factory = this.getFactory();
        var data = packet.getData();

        this._tlec = context.deserialize(packet.getLink("_tlec"), factory.createCouchTlec, factory);
        this._linkInitial();
    }

    _onTlecBuilderDone  (builder) {
        this._isTlecFinished = true;
        this._onChanged();
        this._linkFinished();
    }

    _receiveMessage  (messageData) {
        var result = JSON.parse(messageData.as(Utf8String).toString());
        console.log(result); // parse invitation to group chat

        var grConnection = this.getFactory().createGrConnection();
        grConnection.init({
            invite: (invite)?(invite.invite):null,
            userName: deviceName, // just to identify
        });
    }
}