"use strict";

Tlke.authBitLength = 16;
Tlke.offerBitLength = 128;
Tlke.dhPrivBitLength = 160;

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
    this.state = null;
    this._dhAesKey = null;
    this.dhk = null;
    this.dh = null;
    this.auth = null;
    this.check = null;
    this.authData = null;
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

    _encrypt: function (bytes, customKey) {
        var iv = this._getRandomBytes(128);
        var aes = new Aes(customKey || this._dhAesKey);
        var encryptedData = aes.encryptCbc(bytes, iv);
        return iv.as(Bytes).concat(encryptedData);
    },

    _decrypt: function (bytes, customKey) {
        var dataBitArray = bytes.as(BitArray);
        var iv = dataBitArray.bitSlice(0, 128);
        var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
        var aes = new Aes(customKey || this._dhAesKey);
        return aes.decryptCbc(encryptedData, iv);
    },

    // Alice 1.1 (instantiation)
    _generateOffer: function () {
        this.dh = DiffieHellman.generate(Tlke.dhPrivBitLength, this.random);
        var dhAes = this._getRandomBytes(Tlke.offerBitLength);
        this._dhAesKey = dhAes;
        var outId = dhAes.bitSlice(0, 16);
        var inId = dhAes.bitSlice(16, 32);
        // emit this event before any "packet" event call to configure the appropriate transport behavior
        this.fire("addr", {inId: inId, outId: outId});
        this.fire("offer", this._dhAesKey);
        this.state = Tlke.STATE_AWAITING_OFFER_RESPONSE;
        this.fire("packet", this._getOfferData());
        this._onChanged();
    },

    // Bob 2.1 (instantiation) offer is from getOffer (via IM)
    _acceptOffer: function (offer) {
        this.dh = DiffieHellman.generate(Tlke.dhPrivBitLength, this.random);
        var dhAes = offer.as(Hex).as(BitArray);
        this._dhAesKey = dhAes;
        var inId = dhAes.bitSlice(0, 16);
        var outId = dhAes.bitSlice(16, 32);
        this.state = Tlke.STATE_AWAITING_OFFERDATA;
        this.fire("addr", {inId: inId, outId: outId});
        this._onChanged();
    },

    _getOfferData: function () {
        var dhData = new Hex(this.dh.createKeyExchange());
        return this._encrypt(dhData);
    },

    // Bob 2.2.
    _acceptOfferData: function (bytes) {
        var dhData;
        try {
            dhData = this._decrypt(bytes);
        } catch (ex) {
            console.warn("Received bad bytes.  " + ex.message);
            return;
        }
        var dhDataHex = dhData.as(Hex).value;
        var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
        this.dhk = new Hex(dhkHex);
        this.state = Tlke.STATE_AWAITING_AUTH;
        this.fire("packet", this._getOfferResponse());
        this.fire("auth", null);
    },

    _getOfferResponse: function () {
        var dhData = new Hex(this.dh.createKeyExchange());
        return this._encrypt(dhData);
    },

    // Alice 3.1
    _acceptOfferResponse: function (data) {
        var dhDataHex;
        try {
            dhDataHex = this._decrypt(data).as(Hex).value;
        } catch (ex) {
            console.warn("Received bad bytes.  " + ex.message);
            return;
        }
        var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
        this.dhk = new Hex(dhkHex);

        this.auth = this._getRandomBytes(Tlke.authBitLength);
        this.check = this._getRandomBytes(128);
        this.state = Tlke.STATE_AWAITING_AUTH_RESPONSE;
        this.fire("packet", this._getAuthData());
        this.fire("auth", this.auth);
    },

    _getAuthData: function () {
        return this._encrypt(this.check, this._getVerifiedDhk());
    },

    _getVerifiedDhk: function () {
        var dhk = this.dhk.as(Bytes);
        var auth = this.auth.as(Bytes);
        return hash(dhk.concat(auth));
    },

    // Bob 4.2
    _acceptAuthData: function (bytes) {
        this.authData = bytes;
        if (this.auth) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTH;
        }
    },

    // Bob 4.1
    _acceptAuth: function (auth) {
        this.auth = auth;
        if (this.authData) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTHDATA;
        }
        this._onChanged();
    },

    // Bob 4.3 (4.1 + 4.2)
    _acceptAuthAndData: function () {
        var bytes = this.authData;
        // todo check's checksum and ACHTUNG if not match
        var verified = this._getVerifiedDhk();
        try {
            this.check = this._decrypt(bytes, verified);
        } catch (ex) {
            console.warn("Received bad bytes.  " + ex.message);
            return;
        }
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
        this.fire("packet", this._getAuthResponse());
        var hCheck = hash(this.check);
        this.fire("keyReady", {
            inId: hCheck.bitSlice(0, 16),
            outId: hCheck.bitSlice(16, 32),
            key: hash(this.check.as(Bytes).concat(verified))
        });
        this._onChanged();
    },

    _getAuthResponse: function () {
        var hCheck = hash(this.check);
        return this._encrypt(hCheck, this._getVerifiedDhk());
    },

    // Alice 5
    _acceptAuthResponse: function (bytes) {
        var verified = this._getVerifiedDhk(), hCheck;
        try {
            hCheck = this._decrypt(bytes, verified);
        } catch (ex) {
            console.warn("Received bad bytes.  " + ex.message);
            return;
        }
        if (hash(this.check).as(Hex).value !== hCheck.as(Hex).value) {
            this.state = Tlke.STATE_CONNECTION_FAILED;
            return;
        }
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
        this.fire("keyReady", {
            inId: hCheck.bitSlice(16, 32),
            outId: hCheck.bitSlice(0, 16),
            key: hash(this.check.as(Bytes).concat(verified))
        });
    },

    _onChanged: function () {
        this.fire("changed", this);
    },

    _getRandomBytes: function (bitLength) {
        invariant(isFunction(this.random.bitArray), "random must implement IRandom");
        return this.random.bitArray(bitLength);
    },

    deserialize: function (packet, context) {
        var dto = packet.getData();
        this.state = dto.state;
        this._dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
        this.dhk = dto.dhk ? Hex.deserialize(dto.dhk) : null;
        this.dh = dto.dh ? DiffieHellman.deserialize(dto.dh) : null;
        this.auth = dto.auth ? Hex.deserialize(dto.auth) : null;
        this.check = dto.check ? Hex.deserialize(dto.check) : null;
        this.authData = dto.authData ? Hex.deserialize(dto.authData) : null;
    },

    serialize: function (packet, context) {
        packet.setData({
            state: this.state,
            dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
            dhk: this.dhk ? this.dhk.as(Hex).serialize() : null,
            dh: this.dh ? this.dh.serialize() : null,
            auth: this.auth ? this.auth.as(Hex).serialize() : null,
            check: this.check ? this.check.as(Hex).serialize() : null,
            authData: this.authData ? this.authData.as(Hex).serialize() : null
        });
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
