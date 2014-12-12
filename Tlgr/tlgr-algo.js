"use strict";

TlgrAlgo.tlgrVersion = "1";
TlgrAlgo.gjpVersion = "1";
TlgrAlgo.inviteIdLength = 128;
TlgrAlgo.groupUidLength = 128;
TlgrAlgo.channelIdLength = 32;
TlgrAlgo.sharedKeyLength = 256;
TlgrAlgo.keyPairLength = 512;
TlgrAlgo.ivLength = 128;
TlgrAlgo.keyLength = 128;


TlgrAlgo.hashCount = 1000;
TlgrAlgo.hashLength = 128;



var rsa = require("modules/cryptography/rsa-forge");
var AES = require("modules/cryptography/aes-forge");
var SHA1 = require("modules/cryptography/sha1-crypto-js");

var invariant = require("invariant");

var Hex = require("Multivalue/multivalue/hex");
var ByteBuffer = require("Multivalue/multivalue/byteBuffer");
var BitArray = require("Multivalue/multivalue/bitArray");

var tools = require("modules/tools");
var isFunction = tools.isFunction;

var Users = require('./users');


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

function TlgrAlgo(random) {
    this._random = random;

    this._groupUID = null;
    this._channelID = null;
    this._sharedKey = null;
    this._inviteId = null;
    this._hashStart = null;
    this._hashTail = null;
    this._users = new Users();

    this._keyPair = rsa.generateKeyPair({bits: TlgrAlgo.keyPairLength});
    this._aid = rsa.getPublicKeyFingerprint(this._keyPair.publicKey);
};

TlgrAlgo.prototype.getUID = function () {
    return this._groupUid.as(Hex).serialize();
};

TlgrAlgo.prototype.getUsers = function () {
    return this._users;
};

TlgrAlgo.prototype.getChannelId = function () {
    return this._channelId;
}

TlgrAlgo.prototype.getAid = function () {
    return this._aid;
}

TlgrAlgo.prototype.getMyAid = function () {
    return this._aid.as(Hex).toString();
}

TlgrAlgo.prototype.getMyName = function () {
    return this._users.getUserData(this.getMyAid()).meta.name;
}


TlgrAlgo.prototype._hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, TlgrAlgo.hashLength);
};

TlgrAlgo.prototype._getRandomBytes = function (bitLength) {
    invariant(this._random, "random was not set");
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
};

TlgrAlgo.prototype._nextHashTail = function() {
    var current = this._hashStart;
    for (var i = 0; i < TlgrAlgo.hashCount; i += 1) {
        var next = this._hash(current);
        if(next.as(Hex).isEqualTo(this._hashTail.as(Hex))) {
            this._hashTail = current;
            return next;
        }
        current = next;
    }
};

TlgrAlgo.prototype.createChannel = function() {
    this._groupUid = this._getRandomBytes(TlgrAlgo.groupUidLength);
    this._channelId = this._getRandomBytes(TlgrAlgo.channelIdLength);
    this._sharedKey = this._getRandomBytes(TlgrAlgo.sharedKeyLength);            
};

TlgrAlgo.prototype.generateInvite = function () {
    var inviteId = this._getRandomBytes(TlgrAlgo.inviteIdLength);

    return {
        "pVer": TlgrAlgo.tlgrVersion,
        "inviteId": inviteId.as(Hex).serialize(),
        "groupUid": this._groupUid.as(Hex).serialize(),
        "channelId": this._channelId.as(Hex).serialize(),
        "sharedKey": this._sharedKey.as(Hex).serialize(),
    };
};

TlgrAlgo.prototype.acceptInvite = function (invite) {
    invariant(invite.pVer == TlgrAlgo.tlgrVersion, "invalid protocol version");
    this._inviteId = Hex.deserialize(invite.inviteId);
    this._groupUid = Hex.deserialize(invite.groupUid);
    this._channelId = Hex.deserialize(invite.channelId);
    this._sharedKey = Hex.deserialize(invite.sharedKey);
};

TlgrAlgo.prototype.generateGroupJoinPackage = function (metadata) {
    this._hashStart = this._getRandomBytes(TlgrAlgo.hashLength);
    this._hashTail = this._hashStart;
    for (var i = 0; i < TlgrAlgo.hashCount; i += 1) {
        this._hashTail = this._hash(this._hashTail);
    }

    var gjp = {
        "ver": [TlgrAlgo.tlgrVersion, TlgrAlgo.gjpVersion],
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

TlgrAlgo.prototype.looksLikeGJP = function (gjp) {
    if(typeof gjp === "object") {
        return gjp.aid && gjp.pk && gjp.meta && gjp.ht && gjp.ver && gjp.sign;
    } else {
        return false;
    }
};

TlgrAlgo.prototype.processGroupJoinPackage = function (gjp) {
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
        "ht": ht
    };
    this._users.putUserData(data)
    return data;
};

TlgrAlgo.prototype.privatize = function (aid, data) {
    var key = this._getRandomBytes(TlgrAlgo.keyLength);
    var iv = this._getRandomBytes(TlgrAlgo.ivLength);
    
    var user = this._users.getUserData(aid);
    var encrypted = AES.encryptCbc(data, key, iv);
    var encrypted_key = user.publicKey.encrypt(key, 'RSA-OAEP');

    return encrypted_key.as(ByteBuffer).concat(iv).concat(encrypted);
};

TlgrAlgo.prototype.deprivatize = function(message) {
    var encrypted = new ByteBuffer(message.as(ByteBuffer).value);
    var encrypted_key = encrypted.take(TlgrAlgo.keyPairLength);
    var iv = encrypted.take(TlgrAlgo.ivLength);
    var key = this._keyPair.privateKey.decrypt(encrypted_key, 'RSA-OAEP');

    return AES.decryptCbc(encrypted, key, iv);
};

TlgrAlgo.prototype.encrypt = function (message) {
    invariant(this._sharedKey, "not configured");
    var hx = this._nextHashTail();
    var data = hx.as(ByteBuffer).concat(message);
    var iv = this._getRandomBytes(TlgrAlgo.ivLength);
    var encrypted = AES.encryptCbc(data, this._sharedKey, iv);
    return iv.as(ByteBuffer).concat(encrypted);
};

TlgrAlgo.prototype.decrypt = function (message) {
    invariant(this._sharedKey, "not configured");
    var encrypted = message.as(ByteBuffer);
    var iv = encrypted.take(TlgrAlgo.ivLength);
    var data = AES.decryptCbc(encrypted, this._sharedKey, iv);

    var message = data.as(ByteBuffer);
    var hx = message.take(TlgrAlgo.hashLength);

    return {
        sender: this._users.findUserByHash(hx),
        message: message,
    }
};

TlgrAlgo.prototype.serialize = function () {
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

TlgrAlgo.prototype.deserialize = function (data) {
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

module.exports = TlgrAlgo;
