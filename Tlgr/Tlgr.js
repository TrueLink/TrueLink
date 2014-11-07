
    "use strict";

    Tlgr.tlgrVersion = "1";
    Tlgr.gjpVersion = "1";
    Tlgr.inviteIdLength = 128;
    Tlgr.groupUidLength = 128;
    Tlgr.channelIdLength = 32;
    Tlgr.sharedKeyLength = 256;
    Tlgr.keyPairLength = 512;
    Tlgr.hashCount = 1000;
    Tlgr.hashLength = 128;
    Tlgr.ivLength = 128;
    Tlgr.keyLength = 128;
    Tlgr.messageTypes = {
        "REKEY_INFO": "rekey info",
        "CHANNEL_ABANDONED": "channel abandoned",
        "TEXT" : "text",
        "GJP" : "gjp"
    }

    var forge = require("forge");
    var rsa = require("../modules/cryptography/rsa-forge");
    var AES = require("../modules/cryptography/aes-forge");
    var SHA1 = require("../modules/cryptography/sha1-crypto-js");

    var eventEmitter = require("../modules/events/eventEmitter");
    var invariant = require("../modules/invariant");
    
    var Multivalue = require("../modules/multivalue/multivalue");
    var Hex = require("../modules/multivalue/hex");
    var Utf8String = require("../modules/multivalue/utf8string");
    var ByteBuffer = require("../modules/multivalue/byteBuffer");
    var BitArray = require("../modules/multivalue/bitArray");

    var serializable = require("../modules/serialization/serializable");
    var urandom = require("../modules/urandom/urandom");

    var tools = require("../modules/tools");
    var extend = tools.extend;
    var isFunction = tools.isFunction;

// __________________________________________________________________________ //

    function SerializationHelper() {

    }

    SerializationHelper.serializeValueAsHex = function (value) {
        return value ? value.as(Hex).serialize() : null;
    }

    SerializationHelper.serializeValue = function (value) {
        return value ? value.serialize() : null;
    }

    SerializationHelper.deserializeValueAsHex = function (value) {
        return value ? Hex.deserialize(value) : null;
    }

// __________________________________________________________________________ //

    function Users() {
        this._byAid = {};
    }

    Users.prototype.getUsers = function () {
        return Object.keys(this._byAid).map(function (item) {
            return {
                aid: item,
                name: this._byAid[item].meta.name
            }
        }, this);
    };

    Users.prototype.getUserData = function (aid) {
        return this._byAid[aid.as(Hex).serialize()];
    }

    Users.prototype.putUserData = function (data) {
        this._byAid[data.aid.as(Hex).serialize()] = data;
    }

    Users.prototype.removeUserData = function (data) {
        delete this._byAid[data.aid.as(Hex).serialize()];
    }

    Users.prototype.findUserByHash = function (hx) {
        var hex = hx.as(Hex);
        for (var index in this._byAid) {
            var user = this._byAid[index];
            if (user.ht.as(Hex).isEqualTo(hex)) {
                return user;
            }
        }
    }

    Users.prototype.serialize = function () {
        var byAid = this._byAid;
        var result = {};
        for (var key in byAid) {
            result[key] = {
                aid: byAid[key].aid.as(Hex).serialize(),
                ht: byAid[key].ht.as(Hex).serialize(),
                publicKey: byAid[key].publicKey.serialize(),
                meta: byAid[key].meta
            }
        }
        return result;
    }

    Users.prototype.deserialize = function (byAid) {
        for (var key in byAid) {
            this._byAid[key] = { 
                aid: Hex.deserialize(byAid[key].aid),
                ht: Hex.deserialize(byAid[key].ht),
                meta: byAid[key].meta,
                publicKey: rsa.PublicKey.deserialize(byAid[key].publicKey)
            }
        }
    }

// __________________________________________________________________________ //

    function Algo(random) {
        this._random = random;

        this._groupUID = null;
        this._channelID = null;
        this._sharedKey = null;
        this._inviteId = null;
        this._hashStart = null;
        this._hashTail = null;
        this._users = new Users();

        this._keyPair = rsa.generateKeyPair({bits: Tlgr.keyPairLength});
        this._aid = rsa.getPublicKeyFingerprint(this._keyPair.publicKey);
    };

    Algo.prototype.getUID = function () {
        return this._groupUid.as(Hex).serialize();
    };

    Algo.prototype.getUsers = function () {
        return this._users.getUsers();
    };


    Algo.prototype._hash = function (value) {
        return SHA1(value).as(BitArray).bitSlice(0, Tlgr.hashLength);
    };

    Algo.prototype._getRandomBytes = function (bitLength) {
        invariant(this._random, "random was not set");
        invariant(isFunction(this._random.bitArray), "random must implement IRandom");
        return this._random.bitArray(bitLength);
    };

    Algo.prototype._nextHashTail = function() {
        var current = this._hashStart;
        for (var i = 0; i < Tlgr.hashCount; i += 1) {
            var next = this._hash(current);
            if(next.as(Hex).isEqualTo(this._hashTail.as(Hex))) {
                this._hashTail = current;
                return next;
            }
            current = next;
        }
    };

    Algo.prototype.createChannel = function() {
        this._groupUid = this._getRandomBytes(Tlgr.groupUidLength);
        this._channelId = this._getRandomBytes(Tlgr.channelIdLength);
        this._sharedKey = this._getRandomBytes(Tlgr.sharedKeyLength);            
    };

    Algo.prototype.generateInvite = function () {
        var inviteId = this._getRandomBytes(Tlgr.inviteIdLength);

        return {
            "pVer": Tlgr.tlgrVersion,
            "inviteId": inviteId.as(Hex).serialize(),
            "groupUid": this._groupUid.as(Hex).serialize(),
            "channelId": this._channelId.as(Hex).serialize(),
            "sharedKey": this._sharedKey.as(Hex).serialize(),
        };
    };

    Algo.prototype.acceptInvite = function (invite) {
        invariant(invite.pVer == Tlgr.tlgrVersion, "invalid protocol version");
        this._inviteId = Hex.deserialize(invite.inviteId);
        this._groupUid = Hex.deserialize(invite.groupUid);
        this._channelId = Hex.deserialize(invite.channelId);
        this._sharedKey = Hex.deserialize(invite.sharedKey);
    };

    Algo.prototype.generateGroupJoinPackage = function (metadata) {
        this._hashStart = this._getRandomBytes(Tlgr.hashLength);
        this._hashTail = this._hashStart;
        for (var i = 0; i < Tlgr.hashCount; i += 1) {
            this._hashTail = this._hash(this._hashTail);
        }

        var gjp = {
            "ver": [Tlgr.tlgrVersion, Tlgr.gjpVersion],
            "ht": this._hashTail.as(Hex).serialize(),
            "meta": (metadata)?(metadata):({}),
            "pk": this._keyPair.publicKey.serialize(),
            "aid": this._aid.as(Hex).serialize(),
        };
        if (this._inviteId) {
            gjp.invite = this._inviteId.as(Hex).serialize();
        }

        var values = [gjp.ver, gjp.aid, gjp.ht, gjp.meta, gjp.pk];
        var sign = this._keyPair.privateKey.sign(JSON.stringify(values));
        gjp.sign = sign.as(Hex).serialize();
        return gjp;
    };

    Algo.prototype.looksLikeGJP = function (gjp) {
        if(typeof gjp === "object") {
            return gjp.aid && gjp.pk && gjp.meta && gjp.ht && gjp.ver && gjp.sign;
        } else {
            return false;
        }
    };

    Algo.prototype.processGroupJoinPackage = function (gjp) {
        var publicKey = rsa.PublicKey.deserialize(gjp.pk);
        var aid = Hex.deserialize(gjp.aid);
        var values = [gjp.ver, gjp.aid, gjp.ht, gjp.meta, gjp.pk];
        if (!publicKey.verify(JSON.stringify(values), Hex.deserialize(gjp.sign))) {
            // invalid signature
            return;
        }
        var ht = Hex.deserialize(gjp.ht);
        var data = {
            "aid": aid,
            "publicKey": publicKey,
            "meta": gjp.meta,
            "ht": ht,
        };
        this._users.putUserData(data)
        return data;
    };

    Algo.prototype.privatize = function (aid, data) {
        var key = this._getRandomBytes(Tlgr.keyLength);
        var iv = this._getRandomBytes(Tlgr.ivLength);
        
        var user = this._users.getUserData(aid);
        var encrypted = AES.encryptCbc(data, key, iv);
        var encrypted_key = user.publicKey.encrypt(key, 'RSA-OAEP');

        return encrypted_key.as(ByteBuffer).concat(iv).concat(encrypted);
    };

    Algo.prototype.deprivatize = function(message) {
        var encrypted = message.as(ByteBuffer);
        var encrypted_key = encrypted.take(Tlgr.keyPairLength);
        var iv = encrypted.take(Tlgr.ivLength);
        var key = this._keyPair.privateKey.decrypt(encrypted_key, 'RSA-OAEP');

        return AES.decryptCbc(encrypted, key, iv);
    };

    Algo.prototype.encrypt = function (message) {
        invariant(this._sharedKey, "not configured");
        var hx = this._nextHashTail();
        var data = hx.as(ByteBuffer).concat(message);
        var iv = this._getRandomBytes(Tlgr.ivLength);
        var encrypted = AES.encryptCbc(data, this._sharedKey, iv);
        return iv.as(ByteBuffer).concat(encrypted);
    };

    Algo.prototype.decrypt = function (message) {
        invariant(this._sharedKey, "not configured");
        var encrypted = message.as(ByteBuffer);
        var iv = encrypted.take(Tlgr.ivLength);
        var data = AES.decryptCbc(encrypted, this._sharedKey, iv);

        var message = data.as(ByteBuffer);
        var hx = message.take(Tlgr.hashLength);

        // find message owner
        for (var i = 0; i < Tlgr.hashCount; i += 1) {
            var user = this._users.findUserByHash(hx);
            if(user) {
                return {
                    "sender": user,
                    "message": message,
                }
            }
            hx = this._hash(hx);
        }
        return {
            "message": message,
        }
    };

    Algo.prototype.serialize = function () {
        return {
            groupUid: SerializationHelper.serializeValueAsHex(this._groupUid),
            channelId: SerializationHelper.serializeValueAsHex(this._channelId),
            sharedKey: SerializationHelper.serializeValueAsHex(this._sharedKey),
            inviteId: SerializationHelper.serializeValueAsHex(this._inviteId),
            hashStart: SerializationHelper.serializeValueAsHex(this._hashStart),
            hashTail: SerializationHelper.serializeValueAsHex(this._hashTail),
            publicKey: SerializationHelper.serializeValue(this._keyPair.publicKey),
            privateKey: SerializationHelper.serializeValue(this._keyPair.privateKey),
            users: this._users.serialize(),
            aid: SerializationHelper.serializeValueAsHex(this._aid)
        };
    }
    
    Algo.prototype.deserialize = function (data) {
        this._keyPair = { };
        this._keyPair.publicKey = (data.publicKey)?(rsa.PublicKey.deserialize(data.publicKey)):null;
        this._keyPair.privateKey = (data.privateKey)?(rsa.PrivateKey.deserialize(data.privateKey)):null;
        this._groupUid = SerializationHelper.deserializeValueAsHex(data.groupUid);
        this._channelId = SerializationHelper.deserializeValueAsHex(data.channelId);
        this._sharedKey = SerializationHelper.deserializeValueAsHex(data.sharedKey);
        this._inviteId = SerializationHelper.deserializeValueAsHex(data.inviteId);
        this._hashStart = SerializationHelper.deserializeValueAsHex(data.hashStart);
        this._hashTail = SerializationHelper.deserializeValueAsHex(data.hashTail);
        if(data.users) {
            this._users.deserialize(data.users);
        }
        this._aid = SerializationHelper.deserializeValueAsHex(data.aid);
    }
        


    Tlgr.Algo = Algo;
// __________________________________________________________________________ //

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
        this._algo = new Algo(this._random);
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
            return this._algo.getUsers();
        },

        makePrivateMessage: function (aid, message/*string*/) {
            var usrData = this._algo._users._byAid[aid];
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
                if (this._algo._users._byAid[aid]) {
                    var usrData = this._algo._users._byAid[aid];
                    var msg = this.makePrivateMessage(aid, JSON.stringify(rekeyInfo));
                    this.fire("packet", {
                        addr: this._algo._channelId,
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
                addr: this._algo._channelId,
                data: this._algo.encrypt(new Utf8String(JSON.stringify(msg)))
            });
            this.fire("changed", this);
        },

        afterDeserialize: function () {
            this._channelContext = urandom.int(0, 0xFFFFFFFF);
            this.fire("openAddrIn", {
                addr: this._algo._channelId,
                context: this._channelContext,
                fetch: false
            });
        },


        getMyAid: function () {
            return this._algo._aid.as(Hex).toString();
        },

        getMyName: function () {
            return this._algo._users._byAid[this.getMyAid()].meta.name;
        },
        
        //process only packets from our  channel
        onNetworkPacket: function (networkPacket) {
            invariant(networkPacket
                && networkPacket.addr instanceof Multivalue
                && networkPacket.data instanceof Multivalue, "networkPacket must be {addr: multivalue, data: multivalue}");
            if (this._algo._channelId && this._algo._channelId.as(Hex).isEqualTo(networkPacket.addr.as(Hex))) {
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
                    if(decryptedData.sender.aid.as(Hex).toString() !== this._algo._aid.as(Hex).toString() &&
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
                            this._algo._users.removeUserData(decryptedData.sender);
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
                addr: this._algo._channelId,
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
                addr: this._algo._channelId,
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
                addr: this._algo._channelId,
                data: this._algo.encrypt(new Utf8String(gjpJson))
            });
        },

    });

    module.exports = Tlgr;
