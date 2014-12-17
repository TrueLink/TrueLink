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


var rsa = require("modules/cryptography/rsa-forge");
var AES = require("modules/cryptography/aes-forge");
var SHA1 = require("modules/cryptography/sha1-crypto-js");

var invariant = require("invariant");

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");
var ByteBuffer = require("Multivalue/multivalue/byteBuffer");
var BitArray = require("Multivalue/multivalue/bitArray");

var tools = require("modules/tools");
var isFunction = tools.isFunction;

var Users = require('./users');

var hashtail = require('./hashtail');


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

    this._groupUid = null;
    this._channelId = null;
    this._sharedKey = null;
    this._inviteId = null;
    this._hashGeneratorPool = null;
    this._users = new Users();

    this._keyPair = null;
    this._aid = null;
};

TlgrAlgo.prototype._init = function (args) {
    var invalidArgsMessage = "args should be { "
        + "profileId?: string, "
        + "groupUid?: Multivalue, "
        + "channelId?: Multivalue, "
        + "sharedKey?: Multivalue, "
        + "inviteId?: Multivalue, "
        + "keyPair?: rsa-keypair }";
    invariant(args, invalidArgsMessage);
    invariant(!args.profileId
        || typeof args.profileId === 'string'
        || args.profileId instanceof String, invalidArgsMessage);
    invariant(!args.groupUid || (args.groupUid instanceof Multivalue), invalidArgsMessage);
    invariant(!args.channelId || (args.channelId instanceof Multivalue), invalidArgsMessage);
    invariant(!args.sharedKey || (args.sharedKey instanceof Multivalue), invalidArgsMessage);
    invariant(!args.inviteId || (args.inviteId instanceof Multivalue), invalidArgsMessage);
    invariant(!args.keyPair || (args.keyPair.publicKey && args.keyPair.privateKey), invalidArgsMessage);

    this._hashGeneratorPool = new hashtail.GeneratorPool(this._random, args);

    this._groupUid = args.groupUid || this._getRandomBytes(TlgrAlgo.groupUidLength);
    this._channelId = args.channelId || this._getRandomBytes(TlgrAlgo.channelIdLength);
    this._sharedKey = args.sharedKey || this._getRandomBytes(TlgrAlgo.sharedKeyLength);

    this._inviteId = args.inviteId || null;

    this._keyPair = args.keyPair || rsa.generateKeyPair({bits: TlgrAlgo.keyPairLength});
    this._aid = rsa.getPublicKeyFingerprint(this._keyPair.publicKey);
}

TlgrAlgo.prototype.getSyncArgs = function () {
    return {
        groupUid: this._groupUid.as(Hex).serialize(),
        channelId: this._channelId.as(Hex).serialize(),
        sharedKey: this._sharedKey.as(Hex).serialize(),
        inviteId: this._inviteId && this._inviteId.as(Hex).serialize(),
        keyPair: {
            publicKey: this._keyPair.publicKey.serialize(),
            privateKey: this._keyPair.privateKey.serialize()
        }
    };
}

TlgrAlgo.prototype.sync = function (args, syncArgs) {
    this._init({
        profileId: args && args.profileId,
        groupUid: Hex.deserialize(syncArgs.groupUid),
        channelId: Hex.deserialize(syncArgs.channelId),
        sharedKey: Hex.deserialize(syncArgs.sharedKey),
        inviteId: syncArgs.inviteId && Hex.deserialize(syncArgs.inviteId),
        keyPair: {
            publicKey: rsa.PublicKey.deserialize(syncArgs.keyPair.publicKey),
            privateKey: rsa.PrivateKey.deserialize(syncArgs.keyPair.privateKey)
        },
    });
}

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

TlgrAlgo.prototype._getRandomBytes = function (bitLength) {
    invariant(this._random, "random was not set");
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
};

TlgrAlgo.prototype.createChannel = function(args) {
    this._init({
        profileId: args && args.profileId
    });
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

TlgrAlgo.prototype.acceptInvite = function (args, invite) {
    invariant(invite.pVer == TlgrAlgo.tlgrVersion, "invalid protocol version");

    this._init({
        profileId: args && args.profileId,
        groupUid: Hex.deserialize(invite.groupUid),
        channelId: Hex.deserialize(invite.channelId),
        sharedKey: Hex.deserialize(invite.sharedKey),
        inviteId: Hex.deserialize(invite.inviteId),
    });
};




TlgrAlgo.prototype.generateGroupJoinPackage = function (metadata) {    
    var gen = this._hashGeneratorPool.createGenerator();

    var gjp = {
        ver: [TlgrAlgo.tlgrVersion, TlgrAlgo.gjpVersion],
        ht: gen.end.as(Hex).serialize(),
        meta: (metadata)?(metadata):({}),
        pk: this._keyPair.publicKey.serialize(),
        aid: this._aid.as(Hex).serialize(),
    };
    if (this._inviteId) {
        gjp.invite = this._inviteId.as(Hex).serialize();
    }

    var values = [gjp.ver, gjp.aid, gjp.ht, gjp.meta, gjp.pk];
    var sign = this._keyPair.privateKey.sign(JSON.stringify(values));
    gjp.sign = sign.as(Hex).serialize();
    return {
        gjp: gjp,
        hashActivator: gen.activator
    };
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

TlgrAlgo.prototype.encrypt = function (message, isGjp) {
    invariant(this._sharedKey, "not configured");
    var hx = isGjp ? hashtail.GeneratorPool.getFirstHash() : this._hashGeneratorPool.getNextHash();
    var data = hx.as(ByteBuffer).concat(message);
    var iv = this._getRandomBytes(TlgrAlgo.ivLength);
    var encrypted = AES.encryptCbc(data, this._sharedKey, iv);
    return iv.as(ByteBuffer).concat(encrypted).as(Hex); // hach to avoid ByteBuffer reusage
};

TlgrAlgo.prototype.decrypt = function (message) {
    invariant(this._sharedKey, "not configured");
    var encrypted = message.as(ByteBuffer);
    var iv = encrypted.take(TlgrAlgo.ivLength);
    return AES.decryptCbc(encrypted, this._sharedKey, iv);
};

TlgrAlgo.prototype.unhash = function (data) {
    var message = data.as(ByteBuffer);
    var hx = message.take(hashtail.hashLength);

    return {
        sender: this._users.findUserByHash(hx),
        message: message.as(Hex), // hach to fix ByteBuffer reusage bug
    }
}




TlgrAlgo.prototype.serialize = function () {
    return {
        groupUid: SerializationHelper.serializeValueAsHex(this._groupUid),
        channelId: SerializationHelper.serializeValueAsHex(this._channelId),
        sharedKey: SerializationHelper.serializeValueAsHex(this._sharedKey),
        inviteId: SerializationHelper.serializeValueAsHex(this._inviteId),
        hashGeneratorPool: this._hashGeneratorPool ? this._hashGeneratorPool.serialize() : null,
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
    this._hashGeneratorPool = data.hashGeneratorPool
        ? hashtail.GeneratorPool.deserialize(this._random, data.hashGeneratorPool)
        : null;
    if(data.users) {
        this._users.deserialize(data.users);
    }
    this._aid = SerializationHelper.deserializeValueAsHex(data.aid);
}




TlgrAlgo.prototype.generateHashtail = function () {
    return this._hashGeneratorPool.createGenerator();
}

TlgrAlgo.prototype.areEnoughHashtailsAvailable = function () {
    return this._hashGeneratorPool.areEnoughHashtailsAvailable();
}

TlgrAlgo.prototype.addHashtail = function (userAid, hashtail) {
    this._users.addHashtail(userAid, hashtail);
}


module.exports = TlgrAlgo;
