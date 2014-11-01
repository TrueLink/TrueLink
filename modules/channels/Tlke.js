define(function (require, exports, module) {
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

    function Algo(random) {
        this.random = random;

        this._dhAesKey = null;
        this.dhk = null;
        this.dh = null;
        this.auth = null;
        this.check = null;
        this.authData = null;
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
    }

    // Bob 4.1
    Algo.prototype._acceptAuth = function (auth) {
        this.auth = auth;
    }

    Algo.prototype.hasAuth = function () {        
        return !!this.auth;
    }

    Algo.prototype.hasAuthData = function () {        
        return !!this.authData;
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
            return;
        }
        return {
            inId: hCheck.bitSlice(16, 32),
            outId: hCheck.bitSlice(0, 16),
            key: hash(this.check.as(Bytes).concat(verified))
        };
    }

    Algo.prototype.deserialize = function (data) {
        this._dhAesKey = data.dhAesKey ? Hex.deserialize(data.dhAesKey) : null;
        this.dhk = data.dhk ? Hex.deserialize(data.dhk) : null;
        this.dh = data.dh ? DiffieHellman.deserialize(data.dh) : null;
        this.auth = data.auth ? Hex.deserialize(data.auth) : null;
        this.check = data.check ? Hex.deserialize(data.check) : null;
        this.authData = data.authData ? Hex.deserialize(data.authData) : null;
    },

    Algo.prototype.serialize = function (packet, context) {
        return {
            state: this.state,
            dhAesKey: this._dhAesKey ? this._dhAesKey.as(Hex).serialize() : null,
            dhk: this.dhk ? this.dhk.as(Hex).serialize() : null,
            dh: this.dh ? this.dh.serialize() : null,
            auth: this.auth ? this.auth.as(Hex).serialize() : null,
            check: this.check ? this.check.as(Hex).serialize() : null,
            authData: this.authData ? this.authData.as(Hex).serialize() : null
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
            this.state = Tlke.STATE_AWAITING_OFFER_RESPONSE;
            this.fire("packet", this._algo._getOfferData());
            this._onChanged();
        },

        // Bob 2.1 (instantiation) offer is from getOffer (via IM)
        _acceptOffer: function (offer) {
            var ids = this._algo._acceptOffer(offer);
            this.state = Tlke.STATE_AWAITING_OFFERDATA;        
            this.fire("addr", ids);
            this._onChanged();
        },


        // Bob 2.2.
        _acceptOfferData: function (bytes) {
            this._algo._acceptOfferData(bytes);
            this.state = Tlke.STATE_AWAITING_AUTH;    
            this.fire("packet", this._algo._getOfferResponse());
            this.fire("auth", null);
        },

        // Alice 3.1
        _acceptOfferResponse: function (data) {
            this._algo._acceptOfferResponse(data);            
            this.state = Tlke.STATE_AWAITING_AUTH_RESPONSE;
            this.fire("packet", this._algo._getAuthData());
            this.fire("auth", this.auth);
        },

        // Bob 4.2
        _acceptAuthData: function (bytes) {
            this._algo._acceptAuthData(bytes);
            if (this._algo.hasAuth()) {
                this._acceptAuthAndData();
            } else {
                this.state = Tlke.STATE_AWAITING_AUTH;
            }
        },

        // Bob 4.1
        _acceptAuth: function (auth) {
            this._algo._acceptAuth(auth)
            if (this._algo.hasAuthData()) {
                this._acceptAuthAndData();
            } else {
                this.state = Tlke.STATE_AWAITING_AUTHDATA;
            }
            this._onChanged();
        },

        // Bob 4.3 (4.1 + 4.2)
        _acceptAuthAndData: function () {
            var keyAndCids = this._algo._acceptAuthAndData();
            this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
            this.fire("packet", this._getAuthResponse());
            this.fire("keyReady", keyAndCids);
            this._onChanged();
        },

        // Alice 5
        _acceptAuthResponse: function (bytes) {
            var keyAndCids = this._algo._acceptAuthResponse();

            if (!keyAndCids) {
                this.state = Tlke.STATE_CONNECTION_FAILED;
                return;
            }
            this.state = Algo.STATE_CONNECTION_ESTABLISHED;

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