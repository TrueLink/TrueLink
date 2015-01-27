"use strict";

Tlgr.messageTypes = {
    "REKEY_INFO": "rekey info",
    "CHANNEL_ABANDONED": "channel abandoned",
    "TEXT" : "text",
    "GJP" : "gjp",
    HASHTAIL: "ht"
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
    this._defineEvent("echo");
    this._defineEvent("messageOrEcho");
    this._defineEvent("user_joined");
    this._defineEvent("rekey");
    this._defineEvent("user_left");
    this._defineEvent("readyForSync");

    this._factory = factory;
    this._random = factory.createRandom();
    this._algo = new TlgrAlgo(this._random);

    this._unhandledPacketsData = [];

    // is used to determine if we are hashing another hashtail or user-message
    // in order to avoid calling this.generate() while already being in generation process
    // (should not be serialized?)
    this._unsentHashtailsCount = 0;
}

extend(Tlgr.prototype, eventEmitter, serializable, {


    getUID: function () {
        return this._algo.getUID();
    },

    getKeyPair: function () {
        return this._algo.getKeyPair();
    },

    getUsers: function () {
        return this._algo.getUsers().getUsers();
    },

    getMyAid: function () {
        return this._algo.getMyAid();
    },

    getMyName: function () {
        return this._algo.getMyName();
    },


    afterDeserialize: function () {
        this._openAddrIn(false);
    },


    sendChannelAbandoned: function (reasonRekey) {
        this._sendData(
            Tlgr.messageTypes.CHANNEL_ABANDONED,
            (reasonRekey)?("reason=rekey"):("reason=user exit"));
        this._onChanged();
    },




    //process only packets from our  channel
    onNetworkPacket: function (networkPacket) {
        invariant(networkPacket
            && networkPacket.addr instanceof Multivalue
            && networkPacket.data instanceof Multivalue,
            "networkPacket must be {addr: multivalue, data: multivalue}");
        if (this._algo.getChannelId()
            && this._algo.getChannelId().as(Hex).isEqualTo(networkPacket.addr.as(Hex))) {
            //packet is for our channel lets try to handle

            // trying to decrypt
            var decrypted = null;
            try {
                var decrypted = this._algo.decrypt(networkPacket.data);
            } catch (e) {
                // not for us
                return;
            }

            this._unhandledPacketsData.unshift(decrypted);
            
            // try to handle packets one per cycle while handling succeeds
            var handled;
            do {
                handled = false;
                var i = 0;
                for ( ; i < this._unhandledPacketsData.length; i++) {
                    var packetData = this._unhandledPacketsData[i].as(Hex); // hack to avoid ByteBuffer reusage
                    handled = this._handlePacketData(packetData);
                    if (handled) {
                        break;
                    }
                }
                if (handled) {
                    this._unhandledPacketsData.splice(i, 1);
                    this.fire("changed", this);
                }
            } while (handled);
        }
    },

    _handlePacketData: function (packetData) {        
        var unhashed = this._algo.unhash(packetData);

        var message = null;
        try {
            message = JSON.parse(unhashed.message.as(Utf8String).toString());
        } catch (e) {
            return true; // yes, we handled it: it is not for us
        }

        if(unhashed.sender) {
            var sender = unhashed.sender;
            //console.log("Tlgr got something: ", sender, message);
            if (message.type === Tlgr.messageTypes.HASHTAIL) {
                this._processHashtailFromChannel(sender, message.data);
            } else if (message.type === Tlgr.messageTypes.TEXT) {
                this._processTextMessage(sender, message.data);
            } else if (message.type === Tlgr.messageTypes.CHANNEL_ABANDONED) {
                if (message.data === "reason=user exit") {
                    this._algo.getUsers().removeUserData(sender);
                    this.fire("user_left", { 
                        aid: sender.aid.as(Hex).toString(),
                        name: sender.meta.name
                    });
                }
            } else if (message.type === Tlgr.messageTypes.REKEY_INFO) {
                this._processRekey(sender, message.data);
            }
            return true;
        } else if(message.type === Tlgr.messageTypes.GJP && this._algo.looksLikeGJP(message.data)) {
            // console.log("Tlgr got gjp", "message.data", message.data);
            this._processGroupJoinPacket(message.data);
            return true;
        }
        return false;        
    },

    // this does not fire "changed", but has to. it relies on caller to do this.
    //todo aid should be Multivalue? why string?
    _sendData: function (type, data, aid, isGjp) {
        // console.log("Tlgr._sendData", "type", type, "data", data, "isGjp", isGjp);
        if (!isGjp) {
            this._supplyHashtails();
        }
        if (aid) {
            if (!this._algo.getUsers().getUserData(aid)) {
                return;
            }
            data = this._algo.privatize(Hex.deserialize(aid), new Utf8String(JSON.stringify(data)))
                .as(Hex).serialize();
        }
        this.fire("packet", {
            addr: this._algo.getChannelId(),
            data: this._algo.encrypt(new Utf8String(JSON.stringify({
                type: type,
                data: data
            })), isGjp)
        });
    },



 

    //if args has invite we accept it, if not - we create new channel
    init: function (args, syncArgs) {
        invariant(this._random, "rng is not set");
        this.checkEventHandlers();

        if (syncArgs) {
            this._algo.sync(args, syncArgs);
        } else if (args.invite) {
            this._algo.acceptInvite(args, args.invite);
        } else {
            this._algo.createChannel(args);
        }

        this._openAddrIn(true);

        if (!syncArgs && !args.doNotSendGjp) {
            //send group join package
            var gjpWrapper = this._algo.generateGroupJoinPackage({name:args.userName});
            this._sendData(Tlgr.messageTypes.GJP, gjpWrapper.gjp, null, true);
            gjpWrapper.hashActivator.call();
            this.fire("readyForSync", this._algo.getSyncArgs());
        }

        this._onChanged();
    },

    generateInvitation: function () {
        return this._algo.generateInvite();
    },

    _processGroupJoinPacket: function(data) {
        var userData = this._algo.processGroupJoinPackage(data);
        if(userData.isNewUser) {
            var user = userData.user;
            this.fire("user_joined", {
                aid: user.aid.as(Hex).toString(),
                name: user.meta.name
            });
        }
    },





    //rekeyInfo -  invitation object
    sendRekeyInfo: function (aidList, rekeyInfo) {
        aidList.forEach(function (aid) {
            this._sendData(Tlgr.messageTypes.REKEY_INFO, rekeyInfo, aid);
        }, this);
        this.fire("changed", this);
    },

    _processRekey: function(sender, data) {
        var encrypted = Hex.deserialize(data);

        var decrypted;
        try {
            decrypted = this._algo.deprivatize(encrypted);
        } catch (e) {
            return;
        }

        console.log("Tlgr decrypted private message: ", decrypted);
        var parsed = JSON.parse(decrypted.as(Utf8String).toString());
        this.fire("rekey", {
            doNotSendGjp: !this._algo.areAnyHashtailsAvailable(), // do not send gjp if did not have hashtails!
            rekeyInfo: parsed
        });
    },




    sendMessage: function (text) {
        invariant(typeof text === "string", "tlgr.sendMessage text must be string");
        this._sendData(Tlgr.messageTypes.TEXT, text);
        this._onChanged();
    },

    _processTextMessage: function (sender, data) {
        var messageToFire = {
            sender: { 
                aid: sender.aid.as(Hex).toString(),
                name: sender.meta.name
            },
            text: data
        };
        //if not our own text msg 
        if (sender.aid.as(Hex).toString() !== this._algo.getAid().as(Hex).toString()) {
            this.fire("message", messageToFire);
        } else {
            this.fire("echo", messageToFire);
        }
        this.fire("messageOrEcho", messageToFire);
    },






    _sendHashtail: function (hashtail) {
        this._unsentHashtailsCount++;     
        this._sendData(Tlgr.messageTypes.HASHTAIL, hashtail.as(Hex).serialize())   
        this._unsentHashtailsCount--;        
    },

    _generateHashtail: function () {
        console.log("Tlgr generates hashtail");
        var hashtailWrapper = this._algo.generateHashtail();
        this._sendHashtail(hashtailWrapper.end);
        //activate hashtail after it was send to avoid using it itself for hashing message about it 
        hashtailWrapper.activator.call();
        this._onChanged();
    },

    _supplyHashtails: function () {
        //avoid calling this.generate() while already being in generation process
        if (this._unsentHashtailsCount !== 0) { return; }        

        while (!this._algo.areEnoughHashtailsAvailable()) {
            this._generateHashtail();
        }            
    },    

    _processHashtailFromChannel: function (sender, data) {
        this._algo.addHashtail(sender.aid, Hex.deserialize(data));
    },


    delegateHashtail: function (newOwnerId) {
        if (!this._algo.areAnyHashtailsAvailable()) {
            return null;
        }

        this._supplyHashtails();
        var ht = this._algo.delegateHashtail(newOwnerId);
        this._supplyHashtails();
        
        return ht;
    },

    processDelegatedHashtail: function (hashInfo) {
        return this._algo.processDelegatedHashtail(hashInfo);
    },




    _onChanged: function () {
        this.fire("changed", this);
    },

    _openAddrIn: function (fetch) {
        this._channelContext = urandom.int(0, 0xFFFFFFFF);
        this.fire("openAddrIn", {
            addr: this._algo.getChannelId(),
            context: this._channelContext,
            fetch: fetch
        });
    },

    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.unhandledPacketsData = this._unhandledPacketsData.map(function (packetData) {
            return packetData.as(Hex).serialize();
        });
        packet.setData(data);
    },

    deserialize: function (packet, context) {
        var data = packet.getData();
        this._unhandledPacketsData = !data.unhandledPacketsData ? [] :
            data.unhandledPacketsData.map(function (packetData) {
                return Hex.deserialize(packetData);
            });
        this._algo.deserialize(data);
    },
});

module.exports = Tlgr;
