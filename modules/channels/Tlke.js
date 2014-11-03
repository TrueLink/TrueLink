"use strict";

Algo.authBitLength = 16;
Algo.offerBitLength = 128;
Algo.dhPrivBitLength = 160;

var tools = require("../tools");
var SHA1 = require("../cryptography/sha1-crypto-js");
var DiffieHellman = require("../cryptography/diffie-hellman-leemon");
var Hex = require("../multivalue/hex");
var BitArray = require("../multivalue/bitArray");
var Bytes = require("../multivalue/bytes");
var Aes = require("../cryptography/aes-sjcl");

var eventEmitter = require("../events/eventEmitter");
var invariant = require("../invariant");
var Multivalue = require("../multivalue/multivalue");

var serializable = require("../serialization/serializable");

var extend = tools.extend;
var isFunction = tools.isFunction;

function hash(value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}

// __________________________________________________________________________ //

function DecryptionFailedError(innerError) {
    this.innerError = innerError;
}

// __________________________________________________________________________ //

function Algo(random) {
    this._random = random;

    this.dhAesKey = null;
    this._dhk = null;
    this._dh = null;
    this._auth = null;
    this._check = null;
    this._authData = null;
}

Algo.prototype._getRandomBytes = function (bitLength) {
    invariant(isFunction(this._random.bitArray), "random must implement IRandom");
    return this._random.bitArray(bitLength);
}

Algo.prototype._encrypt = function (bytes, customKey) {
    var iv = this._getRandomBytes(128);
    var aes = new Aes(customKey || this.dhAesKey);
    var encryptedData = aes.encryptCbc(bytes, iv);
    return iv.as(Bytes).concat(encryptedData);
}

Algo.prototype._decrypt = function (bytes, customKey) {
    var dataBitArray = bytes.as(BitArray);
    var iv = dataBitArray.bitSlice(0, 128);
    var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
    var aes = new Aes(customKey || this.dhAesKey);
    try {
        return aes.decryptCbc(encryptedData, iv);
    }
    catch (ex) {
        throw new DecryptionFailedError(ex);
    }
}

// Alice 1.1 (instantiation)
Algo.prototype.generateOffer = function () {
    this._dh = DiffieHellman.generate(Algo.dhPrivBitLength, this._random);
    var dhAes = this._getRandomBytes(Algo.offerBitLength);
    this.dhAesKey = dhAes;
    var outId = dhAes.bitSlice(0, 16);
    var inId = dhAes.bitSlice(16, 32);
    return {inId: inId, outId: outId};
}

// Bob 2.1 (instantiation) offer is from getOffer (via IM)
Algo.prototype.acceptOffer = function (offer) {
    this._dh = DiffieHellman.generate(Algo.dhPrivBitLength, this._random);
    var dhAes = offer.as(Hex).as(BitArray);
    this.dhAesKey = dhAes;
    var inId = dhAes.bitSlice(0, 16);
    var outId = dhAes.bitSlice(16, 32);
    return {inId: inId, outId: outId};
}


Algo.prototype.getOfferData = function () {
    var dhData = new Hex(this._dh.createKeyExchange());
    return this._encrypt(dhData);
}

// Bob 2.2.
Algo.prototype.acceptOfferData = function (bytes) {
    var dhData = this._decrypt(bytes);
    var dhDataHex = dhData.as(Hex).value;
    var dhkHex = this._dh.decryptKeyExchange(dhDataHex);
    this._dhk = new Hex(dhkHex);
}

Algo.prototype.getOfferResponse = function () {
    var dhData = new Hex(this._dh.createKeyExchange());
    return this._encrypt(dhData);
}

// Alice 3.1
Algo.prototype.acceptOfferResponse = function (data) {
    var dhDataHex = this._decrypt(data).as(Hex).value;
    var dhkHex = this._dh.decryptKeyExchange(dhDataHex);
    this._dhk = new Hex(dhkHex);

    this._auth = this._getRandomBytes(Algo.authBitLength);
    this._check = this._getRandomBytes(128);
    return this._auth;
}

Algo.prototype.getAuthData = function () {
    return this._encrypt(this._check, this._getVerifiedDhk());
}

Algo.prototype._getVerifiedDhk = function () {
    var dhk = this._dhk.as(Bytes);
    var auth = this._auth.as(Bytes);
    return hash(dhk.concat(auth));
}

// Bob 4.2
Algo.prototype.acceptAuthData = function (bytes) {
    this._authData = bytes;
}

// Bob 4.1
Algo.prototype.acceptAuth = function (auth) {
    this._auth = auth;
}

Algo.prototype.hasAuth = function () {        
    return !!this._auth;
}

Algo.prototype.hasAuthData = function () {        
    return !!this._authData;
}

// Bob 4.3 (4.1 + 4.2)
Algo.prototype.acceptAuthAndData = function () {
    var bytes = this._authData;
    // todo check's checksum and ACHTUNG if not match
    var verified = this._getVerifiedDhk();
    this._check = this._decrypt(bytes, verified);
    var hCheck = hash(this._check);
    return {
        inId: hCheck.bitSlice(0, 16),
        outId: hCheck.bitSlice(16, 32),
        key: hash(this._check.as(Bytes).concat(verified))
    };
}

Algo.prototype.getAuthResponse = function () {
    var hCheck = hash(this._check);
    return this._encrypt(hCheck, this._getVerifiedDhk());
}

// Alice 5
Algo.prototype.acceptAuthResponse = function (bytes) {
    var verified = this._getVerifiedDhk(),
        hCheck = this._decrypt(bytes, verified);
    if (hash(this._check).as(Hex).value !== hCheck.as(Hex).value) {
        return;
    }
    return {
        inId: hCheck.bitSlice(16, 32),
        outId: hCheck.bitSlice(0, 16),
        key: hash(this._check.as(Bytes).concat(verified))
    };
}

Algo.prototype.deserialize = function (data) {
    this.dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
    this._dhk = data.dhk ? Hex.deserialize(data.dhk) : null;
    this._dh = data.dh ? DiffieHellman.deserialize(data.dh) : null;
    this._auth = data.auth ? Hex.deserialize(data.auth) : null;
    this._check = data.check ? Hex.deserialize(data.check) : null;
    this._authData = data.authData ? Hex.deserialize(data.authData) : null;
}

Algo.prototype.serialize = function (packet, context) {
    return {
        dhAesKey: this.dhAesKey ? this.dhAesKey.as(Hex).serialize() : null,
        dhk: this._dhk ? this._dhk.as(Hex).serialize() : null,
        dh: this._dh ? this._dh.serialize() : null,
        auth: this._auth ? this._auth.as(Hex).serialize() : null,
        check: this._check ? this._check.as(Hex).serialize() : null,
        authData: this._authData ? this._authData.as(Hex).serialize() : null
    };
}

// __________________________________________________________________________ //

// tl channel that is used during key exchange (while channel is being set up)
function Tlke(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("changed");
    this._defineEvent("offer");
    this._defineEvent("auth");
    this._defineEvent("addr");
    this._defineEvent("packet");
    this._defineEvent("keyReady");

    // use the rng without serialization (assume singleton)
    this.random = factory.createRandom();

    this._algo = new Algo(this.random);

    this.state = null;        
}

extend(Tlke.prototype, eventEmitter, serializable, {
    init: function () {
        this.state = Tlke.STATE_NOT_STARTED;
    },
    generate: function () {
        this.checkEventHandlers();
        invariant(this.state === Tlke.STATE_NOT_STARTED,
            "Can't generate offer being in a state %s", this.state);
        this._generateOffer();
    },
    enterOffer: function (offer) {
        this.checkEventHandlers();
        invariant(offer instanceof Multivalue, "offer must be multivalue");
        invariant(this.state === Tlke.STATE_NOT_STARTED,
            "Can't accept offer being in a state %s", this.state);
        invariant(offer, "Received an empty offer");
        this._acceptOffer(offer);
    },
    enterAuth: function (auth) {
        invariant(auth instanceof Multivalue, "offer must be multivalue");
        invariant(auth, "Received an empty auth");
        this._acceptAuth(auth);
    },

    processPacket: function (bytes) {
        invariant(bytes instanceof Multivalue, "bytes must be multivalue");
        switch (this.state) {
        case Tlke.STATE_AWAITING_OFFER_RESPONSE:
            this._acceptOfferResponse(bytes);
            break;
        case Tlke.STATE_AWAITING_AUTH_RESPONSE:
            this._acceptAuthResponse(bytes);
            break;
        case Tlke.STATE_AWAITING_OFFERDATA:
            this._acceptOfferData(bytes);
            break;
        case Tlke.STATE_AWAITING_AUTH:
        case Tlke.STATE_AWAITING_AUTHDATA:
            this._acceptAuthData(bytes);
            break;
        default:
            console.warn("packet ignored: not the right state");
            break;
        }
        this._onChanged();
    },



    // Alice 1.1 (instantiation)
    _generateOffer: function () {
        var ids = this._algo.generateOffer();
        // emit this event before any "packet" event call to configure the appropriate transport behavior
        this.fire("addr", ids);
        this.fire("offer", this._algo.dhAesKey);
        this.state = Tlke.STATE_AWAITING_OFFER_RESPONSE;
        this.fire("packet", this._algo.getOfferData());
        this._onChanged();
    },

    // Bob 2.1 (instantiation) offer is from getOffer (via IM)
    _acceptOffer: function (offer) {
        var ids = this._algo.acceptOffer(offer);
        this.state = Tlke.STATE_AWAITING_OFFERDATA;        
        this.fire("addr", ids);
        this._onChanged();
    },


    // Bob 2.2.
    _acceptOfferData: function (bytes) {
        try {
            this._algo.acceptOfferData(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }
        this.state = Tlke.STATE_AWAITING_AUTH;    
        this.fire("packet", this._algo.getOfferResponse());
        this.fire("auth", null);
    },

    // Alice 3.1
    _acceptOfferResponse: function (data) {
        var auth;  
        try {
            auth = this._algo.acceptOfferResponse(data);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }                     
        this.state = Tlke.STATE_AWAITING_AUTH_RESPONSE;
        this.fire("packet", this._algo.getAuthData());
        this.fire("auth", auth);
    },

    // Bob 4.2
    _acceptAuthData: function (bytes) {
        this._algo.acceptAuthData(bytes);
        if (this._algo.hasAuth()) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTH;
        }
    },

    // Bob 4.1
    _acceptAuth: function (auth) {
        this._algo.acceptAuth(auth)
        if (this._algo.hasAuthData()) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTHDATA;
        }
        this._onChanged();
    },

    // Bob 4.3 (4.1 + 4.2)
    _acceptAuthAndData: function () {
        var keyAndCids;
        try {
            keyAndCids = this._algo.acceptAuthAndData();
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }                     
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
        this.fire("packet", this._algo.getAuthResponse());
        this.fire("keyReady", keyAndCids);
        this._onChanged();
    },

    // Alice 5
    _acceptAuthResponse: function (bytes) {
        var keyAndCids;
        try {
            keyAndCids = this._algo.acceptAuthResponse(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }   

        if (!keyAndCids) {
            this.state = Tlke.STATE_CONNECTION_FAILED;
            return;
        }
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;

        this.fire("keyReady", keyAndCids);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


    deserialize: function (packet, context) {
        var dto = packet.getData();
        this.state = dto.state;
        this._algo.deserialize(dto);
    },

    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.state = this.state;
        packet.setData(data);
        return packet;
    }

});

// A. NOT_STARTED
//    generate() -> packet + offer
//    AWAITING_OFFER_RESPONSE
//    _acceptOfferResponse() -> packet + auth
//    AWAITING_AUTH_RESPONSE
//    _acceptAuthResponse() -> keyReady | authError

// B. NOT_STARTED
//    acceptOffer(offer) -> packet
//    AWAITING_OFFERDATA
//    _acceptOfferData
//    STATE_AWAITING_AUTHDATA   |
//    _acceptAuthData           |--> packet + keyReady
//    STATE_AWAITING_AUTH       |
//    acceptAuth(auth)          |

Tlke.STATE_NOT_STARTED = 1;
Tlke.STATE_AWAITING_OFFERDATA = 2;
Tlke.STATE_AWAITING_OFFER_RESPONSE = 3;
Tlke.STATE_AWAITING_AUTH = 4;
Tlke.STATE_AWAITING_AUTHDATA = 5;
Tlke.STATE_AWAITING_AUTH_RESPONSE = 6;
Tlke.STATE_CONNECTION_ESTABLISHED = 7;
Tlke.STATE_CONNECTION_SYNCED = 8;
Tlke.STATE_CONNECTION_FAILED = -1;

module.exports = Tlke;