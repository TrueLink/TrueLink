define(function (require, exports, module) {
    "use strict";

    var $ = require("zepto");
    var SHA1 = require("modules/cryptography/sha1-crypto-js");
    var DiffieHellman = require("modules/cryptography/diffie-hellman-leemon");
    var Hex = require("modules/data-types/hex");
    var BitArray = require("modules/data-types/bitArray");
    var Bytes = require("modules/data-types/bytes");
    var Aes = require("modules/cryptography/aes-sjcl");
    var Random = require("modules/cryptography/random");


    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    // tl channel that is used during key exchange (while channel is being set up)
    function Tlke() {
        this.state = Tlke.STATE_NOT_STARTED;
        this._defineEvent("changeState");
        this._defineEvent("offer");
        this._defineEvent("auth");
        this._defineEvent("dirty");
        this._defineEvent("addr");
        this._defineEvent("packet");
        this._defineEvent("keyReady");
    }

    Tlke.authBitLength = 16;
    Tlke.offerBitLength = 128;
    Tlke.dhPrivBitLength = 160;

    var EventEmitter = require("modules/channels/EventEmitter");
    var invariant = require("tools/invariant");
    var isMultivalue = require("modules/data-types/isMultivalue");

    Tlke.prototype = new EventEmitter();
    $.extend(Tlke.prototype, {
        generate: function () {
            this.checkEventHandlers();
            invariant(this.state === Tlke.STATE_NOT_STARTED,
                "Can't generate offer being in a state %s", this.state);
            this._generateOffer();
        },
        enterOffer: function (offer) {
            this.checkEventHandlers();
            invariant(isMultivalue(offer), "offer must be multivalue");
            invariant(this.state === Tlke.STATE_NOT_STARTED,
                "Can't accept offer being in a state %s", this.state);
            invariant(offer, "Received an empty offer");
            this._acceptOffer(offer);
        },
        enterAuth: function (auth) {
            invariant(isMultivalue(auth), "offer must be multivalue");
            invariant(auth, "Received an empty auth");
            this._acceptAuth(auth);
        },

        processPacket: function (bytes) {
            invariant(isMultivalue(bytes), "bytes must be multivalue");
            switch (this.state) {
            case Tlke.STATE_AWAITING_OFFER_RESPONSE:
                this._acceptOfferResponse(bytes);
                break;
            case Tlke.STATE_AWAITING_AUTH_RESPONSE:
                this._acceptAuthResponse(bytes);
                break;
            case Tlke.STATE_AWAITING_OFFER:
                this._acceptOfferData(bytes);
                break;
            case Tlke.STATE_AWAITING_AUTH:
                this._acceptAuthData(bytes);
                break;
            default:
                break;
            }
            this._onDirty();
        },

        _encrypt: function (bytes, customKey) {
            var iv = this._getRandomBytes(128);
            var aes = new Aes(customKey || this.dhAesKey);
            var encryptedData = aes.encryptCbc(bytes, iv);
            return iv.as(Bytes).concat(encryptedData);
        },

        _decrypt: function (bytes, customKey) {
            var dataBitArray = bytes.as(BitArray);
            var iv = dataBitArray.bitSlice(0, 128);
            var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
            var aes = new Aes(customKey || this.dhAesKey);
            return aes.decryptCbc(encryptedData, iv);
        },

        // Alice 1.1 (instantiation)
        _generateOffer: function () {
            this.dh = DiffieHellman.generate(Tlke.dhPrivBitLength, this.random);
            var dhAes = this._getRandomBytes(Tlke.offerBitLength);
            this.dhAesKey = dhAes;
            var outId = dhAes.bitSlice(0, 16);
            var inId = dhAes.bitSlice(16, 32);
            // emit this event before any "packet" event call to configure the appropriate transport behavior
            this.fire("addr", {inId: inId, outId: outId});
            this.state = Tlke.STATE_AWAITING_OFFER_RESPONSE;
            this._onChangeState();
            this.fire("offer", this.dhAesKey);
            this.fire("packet", this._getOfferData());
            this._onDirty();
        },

        // Bob 2.1 (instantiation) offer is from getOffer (via IM)
        _acceptOffer: function (offer) {
            this.dh = DiffieHellman.generate(Tlke.dhPrivBitLength, this.random);
            var dhAes = offer.as(Hex).as(BitArray);
            this.dhAesKey = dhAes;
            var inId = dhAes.bitSlice(0, 16);
            var outId = dhAes.bitSlice(16, 32);
            this.fire("addr", {inId: inId, outId: outId});
            this.state = Tlke.STATE_AWAITING_OFFER;
            this._onChangeState();
            this._onDirty();
        },

        _getOfferData: function () {
            var dhData = new Hex(this.dh.createKeyExchange());
            return this._encrypt(dhData);
        },

        // Bob 2.2.
        _acceptOfferData: function (bytes) {
            try {
                var dhData = this._decrypt(bytes);
            } catch (ex) {
                console.warn("Received bad bytes.  " + ex.message);
                return;
            }
            var dhDataHex = dhData.as(Hex).value;
            var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
            this.dhk = new Hex(dhkHex);
            this.state = Tlke.STATE_AWAITING_AUTH;
            this._onChangeState();
            this.fire("packet", this._getOfferResponse());
            this.fire("auth", null);
        },

        _getOfferResponse: function () {
            var dhData = new Hex(this.dh.createKeyExchange());
            return this._encrypt(dhData);
        },

        // Alice 3.1
        _acceptOfferResponse: function (data) {
            try {
                var dhDataHex = this._decrypt(data).as(Hex).value;
            } catch (ex) {
                console.warn("Received bad bytes.  " + ex.message);
                return;
            }
            var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
            this.dhk = new Hex(dhkHex);

            this.auth = this._getRandomBytes(Tlke.authBitLength);
            this.check = this._getRandomBytes(128);
            this.state = Tlke.STATE_AWAITING_AUTH_RESPONSE;
            this._onChangeState();
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
            }
        },

        // Bob 4.1
        _acceptAuth: function (auth) {
            this.auth = auth;
            if (this.authData) {
                this._acceptAuthAndData();
            }
            this._onDirty();
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
            this._onChangeState();
            this.fire("packet", this._getAuthResponse());
            var hCheck = hash(this.check);
            this.fire("keyReady", {
                inId: hCheck.bitSlice(0, 16),
                outId: hCheck.bitSlice(16, 32),
                key: hash(this.check.as(Bytes).concat(verified))
            });
            this._onDirty();
        },

        _getAuthResponse: function () {
            var hCheck = hash(this.check);
            return this._encrypt(hCheck, this._getVerifiedDhk());
        },

        // Alice 5
        _acceptAuthResponse: function (bytes) {
            var verified = this._getVerifiedDhk();
            try {
                var hCheck = this._decrypt(bytes, verified);
            } catch (ex) {
                console.warn("Received bad bytes.  " + ex.message);
                return;
            }
            if (hash(this.check).as(Hex).value !== hCheck.as(Hex).value) {
                this.state = Tlke.STATE_CONNECTION_FAILED;
                this._onChangeState();
                return;
            }
            this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
            this._onChangeState();
            this.fire("keyReady", {
                inId: hCheck.bitSlice(16, 32),
                outId: hCheck.bitSlice(0, 16),
                key: hash(this.check.as(Bytes).concat(verified))
            });
        },

        _onChangeState: function () {
            this.fire("changeState", this.state);
        },

        _onDirty: function () {
            this.fire("dirty");
        },

        _getRandomBytes: function (bitLength) {
            invariant(this.random, "No valid rng is set");
            return this.random.bitArray(bitLength);
        },
        // IRng: multivalue bitArray(bitLength)
        setRng: function (rng) {
            invariant(rng instanceof Random, "rng must be instanceof Random");
            this.random = rng;
        },

        deserialize: function (packet, context) {
            var dto = packet.getData();
            this.state = dto.state;
            this.dhAesKey = dto.dhAesKey ? Hex.deserialize(dto.dhAesKey) : null;
            this.dhk = dto.dhk ? Hex.deserialize(dto.dhk) : null;
            this.dh = dto.dh ? DiffieHellman.deserialize(dto.dh) : null;
            this.auth = dto.auth ? Hex.deserialize(dto.auth) : null;
            this.check = dto.check ? Hex.deserialize(dto.check) : null;
            this.authData = dto.authData ? Hex.deserialize(dto.authData) : null;
            this.random = context.deserialize(packet.getLink("random"));
        },

        serialize: function (packet, context) {
            packet.setData({
                state: this.state,
                dhAesKey: this.dhAesKey ? this.dhAesKey.as(Hex).serialize() : null,
                dhk: this.dhk ? this.dhk.as(Hex).serialize() : null,
                dh: this.dh ? this.dh.serialize() : null,
                auth: this.auth ? this.auth.as(Hex).serialize() : null,
                check: this.check ? this.check.as(Hex).serialize() : null,
                authData: this.authData ? this.authData.as(Hex).serialize() : null
            });
            packet.setLink("random", context.serialize(this.random));
            return packet;
        }

    });


    Tlke.STATE_NOT_STARTED = 1;
    Tlke.STATE_AWAITING_OFFER = 2;
    Tlke.STATE_AWAITING_OFFER_RESPONSE = 3;
    Tlke.STATE_AWAITING_AUTH = 4;
    Tlke.STATE_AWAITING_AUTH_RESPONSE = 5;
    Tlke.STATE_CONNECTION_ESTABLISHED = 6;
    Tlke.STATE_CONNECTION_SYNCED = 7;
    Tlke.STATE_CONNECTION_FAILED = -1;

    module.exports = Tlke;
});