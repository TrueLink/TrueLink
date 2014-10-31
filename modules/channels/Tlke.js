define(function (require, exports, module) {
    "use strict";

    Algo.authBitLength = 16;
    Algo.offerBitLength = 128;
    Algo.dhPrivBitLength = 160;
    Tlke.authBitLength = Algo.authBitLength;
    Tlke.offerBitLength = Algo.offerBitLength;
    Tlke.dhPrivBitLength = Algo.dhPrivBitLength;

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

    function Algo(random) {
        this.random = random;

        this.state = null;
        this._dhAesKey = null;
        this.dhk = null;
        this.dh = null;
        this.auth = null;
        this.check = null;
        this.authData = null;
    }

    Algo.prototype.init = function () {
        this.state = Algo.STATE_NOT_STARTED;
    }


    Algo.prototype._getRandomBytes = function (bitLength) {
        invariant(isFunction(this.random.bitArray), "random must implement IRandom");
        return this.random.bitArray(bitLength);
    }

    Algo.prototype._encrypt = function (bytes, customKey) {
        var iv = this._getRandomBytes(128);
        var aes = new Aes(customKey || this._dhAesKey);
        var encryptedData = aes.encryptCbc(bytes, iv);
        return iv.as(Bytes).concat(encryptedData);
    }

    Algo.prototype._decrypt = function (bytes, customKey) {
        var dataBitArray = bytes.as(BitArray);
        var iv = dataBitArray.bitSlice(0, 128);
        var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
        var aes = new Aes(customKey || this._dhAesKey);
        return aes.decryptCbc(encryptedData, iv);
    }

    // Alice 1.1 (instantiation)
    Algo.prototype._generateOffer = function () {
        this.dh = DiffieHellman.generate(Algo.dhPrivBitLength, this.random);
        var dhAes = this._getRandomBytes(Algo.offerBitLength);
        this._dhAesKey = dhAes;
        var outId = dhAes.bitSlice(0, 16);
        var inId = dhAes.bitSlice(16, 32);
        return {inId: inId, outId: outId};
    }

    // Bob 2.1 (instantiation) offer is from getOffer (via IM)
    Algo.prototype._acceptOffer = function (offer) {
        this.dh = DiffieHellman.generate(Algo.dhPrivBitLength, this.random);
        var dhAes = offer.as(Hex).as(BitArray);
        this._dhAesKey = dhAes;
        var inId = dhAes.bitSlice(0, 16);
        var outId = dhAes.bitSlice(16, 32);
        this.state = Algo.STATE_AWAITING_OFFERDATA;
        return {inId: inId, outId: outId};
    }


    Algo.prototype._getOfferData = function () {
        var dhData = new Hex(this.dh.createKeyExchange());
        return this._encrypt(dhData);
    }

    // Bob 2.2.
    Algo.prototype._acceptOfferData = function (bytes) {
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
    }

    Algo.prototype._getOfferResponse = function () {
        var dhData = new Hex(this.dh.createKeyExchange());
        return this._encrypt(dhData);
    }

    // Alice 3.1
    Algo.prototype._acceptOfferResponse = function (data) {
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
    }

    Algo.prototype._getAuthData = function () {
        return this._encrypt(this.check, this._getVerifiedDhk());
    }

    Algo.prototype._getVerifiedDhk = function () {
        var dhk = this.dhk.as(Bytes);
        var auth = this.auth.as(Bytes);
        return hash(dhk.concat(auth));
    }

    // Bob 4.2
    Algo.prototype._acceptAuthData = function (bytes) {
        this.authData = bytes;
        if (this.auth) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTH;
        }
    }

    // Bob 4.1
    Algo.prototype._acceptAuth = function (auth) {
        this.auth = auth;
        if (this.authData) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTHDATA;
        }
    }

    // Bob 4.3 (4.1 + 4.2)
    Algo.prototype._acceptAuthAndData = function () {
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
        return {
            inId: hCheck.bitSlice(0, 16),
            outId: hCheck.bitSlice(16, 32),
            key: hash(this.check.as(Bytes).concat(verified))
        };
    }

    Algo.prototype._getAuthResponse = function () {
        var hCheck = hash(this.check);
        return this._encrypt(hCheck, this._getVerifiedDhk());
    }

    // Alice 5
    Algo.prototype._acceptAuthResponse = function (bytes) {
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
        return {
            inId: hCheck.bitSlice(16, 32),
            outId: hCheck.bitSlice(0, 16),
            key: hash(this.check.as(Bytes).concat(verified))
        };
    }

    Algo.STATE_NOT_STARTED = 1;
    Algo.STATE_AWAITING_OFFERDATA = 2;
    Algo.STATE_AWAITING_OFFER_RESPONSE = 3;
    Algo.STATE_AWAITING_AUTH = 4;
    Algo.STATE_AWAITING_AUTHDATA = 5;
    Algo.STATE_AWAITING_AUTH_RESPONSE = 6;
    Algo.STATE_CONNECTION_ESTABLISHED = 7;
    Algo.STATE_CONNECTION_SYNCED = 8;
    Algo.STATE_CONNECTION_FAILED = -1;

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
    }

    extend(Tlke.prototype, eventEmitter, serializable, {
        getState: function () {
            return this._algo.state;
        },
        init: function () {
            this._algo.init();
        },
        generate: function () {
            this.checkEventHandlers();
            invariant(this.getState() === Algo.STATE_NOT_STARTED,
                "Can't generate offer being in a state %s", this.state);
            this._generateOffer();
        },
        enterOffer: function (offer) {
            this.checkEventHandlers();
            invariant(offer instanceof Multivalue, "offer must be multivalue");
            invariant(this.getState() === Tlke.STATE_NOT_STARTED,
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
            switch (this.getState()) {
            case Algo.STATE_AWAITING_OFFER_RESPONSE:
                this._acceptOfferResponse(bytes);
                break;
            case Algo.STATE_AWAITING_AUTH_RESPONSE:
                this._acceptAuthResponse(bytes);
                break;
            case Algo.STATE_AWAITING_OFFERDATA:
                this._acceptOfferData(bytes);
                break;
            case Algo.STATE_AWAITING_AUTH:
            case Algo.STATE_AWAITING_AUTHDATA:
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
            var ids = this._algo._generateOffer();
            // emit this event before any "packet" event call to configure the appropriate transport behavior
            this.fire("addr", ids);
            this.fire("offer", this._algo._dhAesKey);
            this._algo.state = Algo.STATE_AWAITING_OFFER_RESPONSE;
            this.fire("packet", this._algo._getOfferData());
            this._onChanged();
        },

        // Bob 2.1 (instantiation) offer is from getOffer (via IM)
        _acceptOffer: function (offer) {
            var ids = this._algo._acceptOffer(offer);
            this.fire("addr", ids);
            this._onChanged();
        },


        // Bob 2.2.
        _acceptOfferData: function (bytes) {
            this._algo._acceptOfferData(bytes);
            this.fire("packet", this._getOfferResponse());
            this.fire("auth", null);
        },

        // Alice 3.1
        _acceptOfferResponse: function (data) {
            this._algo._acceptOfferResponse(data);
            this.fire("packet", this._getAuthData());
            this.fire("auth", this.auth);
        },

        // Bob 4.2
        _acceptAuthData: function (bytes) {
            this._algo._acceptAuthData();
        },

        // Bob 4.1
        _acceptAuth: function (auth) {
            this._algo._acceptAuth();
            this._onChanged();
        },

        // Bob 4.3 (4.1 + 4.2)
        _acceptAuthAndData: function () {
            var keyReady = this._algo._acceptAuthAndData();
            this.fire("packet", this._getAuthResponse());
            this.fire("keyReady", idsKey);
            this._onChanged();
        },

        // Alice 5
        _acceptAuthResponse: function (bytes) {
            var keyReady = this._algo._acceptAuthResponse();
            this.fire("keyReady", keyReady);
        },

        _onChanged: function () {
            this.fire("changed", this);
        },


        deserialize: function (packet, context) {
            var dto = packet.getData();
            this._algo.state = dto.state;
            this._algo._dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
            this._algo.dhk = dto.dhk ? Hex.deserialize(dto.dhk) : null;
            this._algo.dh = dto.dh ? DiffieHellman.deserialize(dto.dh) : null;
            this._algo.auth = dto.auth ? Hex.deserialize(dto.auth) : null;
            this._algo.check = dto.check ? Hex.deserialize(dto.check) : null;
            this._algo.authData = dto.authData ? Hex.deserialize(dto.authData) : null;
        },

        serialize: function (packet, context) {
            packet.setData({
                state: this._algo.state,
                dhAesKey: this._algo._dhAesKey ? this._algo._dhAesKey.as(Hex).serialize() : null,
                dhk: this._algo.dhk ? this._algo.dhk.as(Hex).serialize() : null,
                dh: this._algo.dh ? this._algo.dh.serialize() : null,
                auth: this._algo.auth ? this._algo.auth.as(Hex).serialize() : null,
                check: this._algo.check ? this._algo.check.as(Hex).serialize() : null,
                authData: this._algo.authData ? this._algo.authData.as(Hex).serialize() : null
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

    Tlke.STATE_NOT_STARTED = Algo.STATE_NOT_STARTED;
    Tlke.STATE_AWAITING_OFFERDATA = Algo.STATE_AWAITING_OFFERDATA;
    Tlke.STATE_AWAITING_OFFER_RESPONSE = Algo.STATE_AWAITING_OFFER_RESPONSE;
    Tlke.STATE_AWAITING_AUTH = Algo.STATE_AWAITING_AUTH;
    Tlke.STATE_AWAITING_AUTHDATA = Algo.STATE_AWAITING_AUTHDATA;
    Tlke.STATE_AWAITING_AUTH_RESPONSE = Algo.STATE_AWAITING_AUTH_RESPONSE;
    Tlke.STATE_CONNECTION_ESTABLISHED = Algo.STATE_CONNECTION_ESTABLISHED;
    Tlke.STATE_CONNECTION_SYNCED = Algo.STATE_CONNECTION_SYNCED;
    Tlke.STATE_CONNECTION_FAILED = Algo.STATE_CONNECTION_FAILED;

    module.exports = Tlke;
});