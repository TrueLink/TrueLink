"use strict";

Tlgr.messageTypes = {
    "REKEY_INFO": "rekey info",
    "CHANNEL_ABANDONED": "channel abandoned",
    "TEXT" : "text",
    "GJP" : "gjp"
}

var eventEmitter = require("modules/events/eventEmitter");
var invariant = require("invariant");

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");
var Utf8String = require("Multivalue/multivalue/utf8string");

var serializable = require("modules/serialization/serializable");
var urandom = require("modules/urandom/urandom");

var tools = require("modules/tools");
var extend = tools.extend;
var isFunction = tools.isFunction;

var TlgrAlgo = require('./tlgr-algo');

Tlgr.Algo = TlgrAlgo;

function Tlgr(factory) {
    console.log("Constructing Tlgr...");
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("changed");
    this._defineEvent("packet");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");
    this._defineEvent("message");
    this._defineEvent("user_joined");
    this._defineEvent("rekey");
    this._defineEvent("user_left");

    this._factory = factory;
    this._random = factory.createRandom();
    this._algo = new TlgrAlgo(this._random);
}

extend(Tlgr.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {
        var data = this._algo.serialize();
        packet.setData(data);
    },

    deserialize: function (packet, context) {
        var data = packet.getData();
        this._algo.deserialize(data);
    },

    getUID: function () {
        return this._algo.getUID();
    },

    getUsers: function () {
        return this._algo.getUsers().getUsers();
    },

    makePrivateMessage: function (aid, message/*string*/) {
        var usrData = this._algo.getUsers().getUserData(aid);
        var encrypted = this._algo.privatize(Hex.deserialize(aid), new Utf8String(message));
        var msg = {
            type: Tlgr.messageTypes.REKEY_INFO,
            data: encrypted.as(Hex).serialize()
        }
        return msg;
    },

    //rekeyInfo -  invitation object
    sendRekeyInfo: function (aidList, rekeyInfo) {
        aidList.forEach(function (aid) {
            var usrData = this._algo.getUsers().getUserData(aid);
            if (usrData) {
                var msg = this.makePrivateMessage(aid, JSON.stringify(rekeyInfo));
                this.fire("packet", {
                    addr: this._algo.getChannelId(),
                    data: this._algo.encrypt(new Utf8String(JSON.stringify(msg)))
                });
            }
        }, this);
        this.fire("changed", this);
    },

    sendChannelAbandoned: function (reasonRekey) {
        var msg = {
            type: "channel abandoned",
            data: (reasonRekey)?("reason=rekey"):("reason=user exit")
        }
        this.fire("packet", {
            addr: this._algo.getChannelId(),
            data: this._algo.encrypt(new Utf8String(JSON.stringify(msg)))
        });
        this.fire("changed", this);
    },

    afterDeserialize: function () {
        this._channelContext = urandom.int(0, 0xFFFFFFFF);
        this.fire("openAddrIn", {
            addr: this._algo.getChannelId(),
            context: this._channelContext,
            fetch: false
        });
    },


    getMyAid: function () {
        return this._algo.getMyAid();
    },

    getMyName: function () {
        return this._algo.getMyName();
    },
    
    //process only packets from our  channel
    onNetworkPacket: function (networkPacket) {
        invariant(networkPacket
            && networkPacket.addr instanceof Multivalue
            && networkPacket.data instanceof Multivalue, "networkPacket must be {addr: multivalue, data: multivalue}");
        if (this._algo.getChannelId() && this._algo.getChannelId().as(Hex).isEqualTo(networkPacket.addr.as(Hex))) {
            //packet is for our channel lets try to decrypt
            console.log("Tlgr: trying to decrypt packet");
            var message = null;
            var decryptedData = null;
            try {
                decryptedData = this._algo.decrypt(networkPacket.data);
                message = JSON.parse(decryptedData.message.as(Utf8String).toString());
            }catch (e)
            {
                console.log(e);
                return;
            }

            if(decryptedData.sender) {
                console.log("Tlgr got something: ", decryptedData.sender, message);
                //if not our own text msg 
                if(decryptedData.sender.aid.as(Hex).toString() !== this._algo.getAid().as(Hex).toString() &&
                        message.type === Tlgr.messageTypes.TEXT) {
                    this.fire("message", {
                        sender: { 
                            aid: decryptedData.sender.aid.as(Hex).toString(),
                            name: decryptedData.sender.meta.name
                        },
                        text: message.data
                    });
                    // == CHANNEL_ABANDONED
                } else if (message.type === Tlgr.messageTypes.CHANNEL_ABANDONED) {
                    if (message.data === "reason=user exit") {
                        this._algo.getUsers().removeUserData(decryptedData.sender);
                        this.fire("user_left", { 
                            aid: decryptedData.sender.aid.as(Hex).toString(),
                            name: decryptedData.sender.meta.name
                        });
                    }
                } else if (message.type === Tlgr.messageTypes.REKEY_INFO) {
                    try {
                        var encrypted = Hex.deserialize(message.data);
                        var decrypted = this._algo.deprivatize(encrypted);
                        console.log("Tlgr decrypted private message: ", decrypted);
                        decrypted = JSON.parse(decrypted.as(Utf8String).toString());

                        this.fire("rekey", decrypted);
                        this.fire("changed", this);
                        return;
                    } catch (e) {
                    }
                }
            }else if(message.type === Tlgr.messageTypes.GJP && this._algo.looksLikeGJP(message.data)) {
                console.log("Tlgr got gjp", message.data);
                var userData = this._algo.processGroupJoinPackage(message.data); 
                if(userData) {
                    this.fire("user_joined", { 
                            aid: userData.aid.as(Hex).toString(),
                            name: userData.meta.name
                        });
                }
            }
            this.fire("changed", this);
        }
    },

    generateInvitation: function () {
        return this._algo.generateInvite();
    },

    sendMessage: function (text) {
        invariant(typeof text === "string", "tlgr.sendMessage text must be string");
        var msg = {
            type: Tlgr.messageTypes.TEXT,
            data: text
        }
        this.fire("packet", {
            addr: this._algo.getChannelId(),
            data: this._algo.encrypt(new Utf8String(JSON.stringify(msg)))
        });
        this.fire("changed", this);
    },

    //if args has invite we accept it, if not - we create new channel
    init: function (args) {
        invariant(this._random, "rng is not set");
        this.checkEventHandlers();
        if(args.invite){
            this._algo.acceptInvite(args.invite);
        }else {
            this._algo.createChannel();
        }
        this._channelContext = urandom.int(0, 0xFFFFFFFF);
        //lets listen for packets from that channel
        this.fire("openAddrIn", {
            addr: this._algo.getChannelId(),
            context: this._channelContext,
            fetch: true
        });
        //send group join package
        var gjp = this._algo.generateGroupJoinPackage({name:args.userName});
        gjp = {
            type: Tlgr.messageTypes.GJP,
            data: gjp
        };
        var gjpJson = JSON.stringify(gjp);
        
        this.fire("packet", {
            addr: this._algo.getChannelId(),
            data: this._algo.encrypt(new Utf8String(gjpJson))
        });
    },

});

module.exports = Tlgr;
