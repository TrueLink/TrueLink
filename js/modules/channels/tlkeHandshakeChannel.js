define(["modules/channels/channel",
    "zepto",
    "modules/cryptography/diffie-hellman-leemon",
    "modules/data-types/hex",
    "modules/data-types/bitArray",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js",
    "modules/cryptography/aes-sjcl",
    "modules/converters/customTypes"
], function (Channel, $, DiffieHellman, Hex, BitArray, Bytes, SHA1, Aes) {
    "use strict";

    var channelAesKeyEffectiveBitLength = 128;
    var authBitLength = 16;
    var dhPrivBitLength = 160;

    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    // tl channel that is used during key exchange (while channel is being set up)
    function TlkeHandshakeChannel() {
        this.state = TlkeHandshakeChannel.STATE_NOT_STARTED;
    }

    TlkeHandshakeChannel.prototype = new Channel();
    $.extend(TlkeHandshakeChannel.prototype, {
        enterToken: function (token, context) {
            if (token instanceof TlkeHandshakeChannel.GenerateToken) {
                this._generateOffer();
            } else if (token instanceof TlkeHandshakeChannel.OfferToken) {
                this._acceptOffer(token.offer);
            } else if (token instanceof TlkeHandshakeChannel.AuthToken) {
                this._acceptAuth(token.auth);
            }
            this._notifyDirty();
        },
        processPacket: function (bytes) {
            switch (this.state) {
            case TlkeHandshakeChannel.STATE_AWAITING_OFFER_RESPONSE:
                this._acceptOfferResponse(bytes);
                break;
            case TlkeHandshakeChannel.STATE_AWAITING_AUTH_RESPONSE:
                this._acceptAuthResponse(bytes);
                break;
            case TlkeHandshakeChannel.STATE_AWAITING_OFFER:
                this._acceptOfferData(bytes);
                break;
            case TlkeHandshakeChannel.STATE_AWAITING_AUTH:
                this._acceptAuthData(bytes);
                break;
            default:
                break;
            }
            this._notifyDirty();
        },

        getState: function () { return this.state; },
        serialize: function () { throw new Error("Not implemented"); },

        _encrypt: function (bytes, customKey) {
            var iv = this.random.bitArray(128);
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
            if (!this.random || typeof this.random.bitArray !== "function") {
                throw new Error("No valid rng is set");
            }
            this.dh = new DiffieHellman(dhPrivBitLength, this.random);
            var dhAes = this.random.bitArray(channelAesKeyEffectiveBitLength);
            this.dhAesKey = dhAes;
            this.outChannelName = dhAes.bitSlice(0, 16);
            this.inChannelName = dhAes.bitSlice(16, 32);
            this._notifyChannel({inId: this.inChannelName, outId: this.outChannelName});
            this.state = TlkeHandshakeChannel.STATE_AWAITING_OFFER_RESPONSE;
            this._sendPacket(this._getOfferData());
            this._emitPrompt(new TlkeHandshakeChannel.OfferToken(this.dhAesKey));
        },

        // Bob 2.1 (instantiation) offer is from getOffer (via IM)
        _acceptOffer: function (offer) {
            this.dh = new DiffieHellman(dhPrivBitLength, this.random);
            var dhAes = offer.as(Hex).as(BitArray);
            this.dhAesKey = dhAes;
            this.inChannelName = dhAes.bitSlice(0, 16);
            this.outChannelName = dhAes.bitSlice(16, 32);
            this._notifyChannel({inId: this.inChannelName, outId: this.outChannelName});
            this.state = TlkeHandshakeChannel.STATE_AWAITING_OFFER;
        },

        _getOfferData: function () {
            var dhData = new Hex(this.dh.createKeyExchange());
            return this._encrypt(dhData);
        },

        // Bob 2.2.
        _acceptOfferData: function (bytes) {
            var dhData = this._decrypt(bytes);
            var dhDataHex = dhData.as(Hex).value;
            var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
            this.dhk = new Hex(dhkHex);
            this.state = TlkeHandshakeChannel.STATE_AWAITING_AUTH;
            this._sendPacket(this._getOfferResponse());
            this._emitPrompt(new TlkeHandshakeChannel.AuthToken(), null);
        },

        _getOfferResponse: function () {
            var dhData = new Hex(this.dh.createKeyExchange());
            return this._encrypt(dhData);
        },

        // Alice 3.1
        _acceptOfferResponse: function (data) {
            var dhDataHex = this._decrypt(data).as(Hex).value;
            var dhkHex = this.dh.decryptKeyExchange(dhDataHex);
            this.dhk = new Hex(dhkHex);

            this.auth = this.random.bitArray(authBitLength);
            this.check = this.random.bitArray(128);
            this.state = TlkeHandshakeChannel.STATE_AWAITING_AUTH_RESPONSE;
            this._sendPacket(this._getAuthData());
            this._emitPrompt(new TlkeHandshakeChannel.AuthToken(this.auth));
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
        },

        // Bob 4.3 (4.1 + 4.2)
        _acceptAuthAndData: function () {
            var bytes = this.authData;
            // todo check's checksum and ACHTUNG if not match
            var verified = this._getVerifiedDhk();
            this.check = this._decrypt(bytes, verified);
            this.state = TlkeHandshakeChannel.STATE_CONNECTION_ESTABLISHED;
            this._sendPacket(this._getAuthResponse());
            var hCheck = hash(this.check);
            this._emitPrompt(new TlkeHandshakeChannel.NewChannelToken(
                hCheck.bitSlice(0, 16),
                hCheck.bitSlice(16, 32),
                hash(this.check.as(Bytes).concat(verified))
            ));
        },

        _getAuthResponse: function () {
            var hCheck = hash(this.check);
            return this._encrypt(hCheck, this._getVerifiedDhk());
        },

        // Alice 5
        _acceptAuthResponse: function (bytes) {
            var verified = this._getVerifiedDhk();
            var hCheck = this._decrypt(bytes, verified);
            if (hash(this.check).as(Hex).value !== hCheck.as(Hex).value) {
                this.state = TlkeHandshakeChannel.STATE_CONNECTION_FAILED;
                return;
            }
            this.state = TlkeHandshakeChannel.STATE_CONNECTION_ESTABLISHED;
            this._emitPrompt(new TlkeHandshakeChannel.NewChannelToken(
                hCheck.bitSlice(16, 32),
                hCheck.bitSlice(0, 16),
                hash(this.check.as(Bytes).concat(verified))
            ));
        }
    });

    TlkeHandshakeChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
        var deserialized = new TlkeHandshakeChannel();
        ["dh", "dhk", "dhAesKey", "inChannelName", "outChannelName", "state"].forEach(function (key) {
            this[key] = dto.getData(key);
        });
        return deserialized;
    };

    TlkeHandshakeChannel.GenerateToken = function () {};
    TlkeHandshakeChannel.OfferToken = function (offerBytes) { this.offer = offerBytes; };
    TlkeHandshakeChannel.AuthToken = function (authBytes) { this.auth = authBytes; };
    TlkeHandshakeChannel.NewChannelToken = function (inId, outId, key) {
        this.inId = inId;
        this.outId = outId;
        this.key = key;
    };

    TlkeHandshakeChannel.STATE_NOT_STARTED = 1;
    TlkeHandshakeChannel.STATE_AWAITING_OFFER = 2;
    TlkeHandshakeChannel.STATE_AWAITING_OFFER_RESPONSE = 3;
    TlkeHandshakeChannel.STATE_AWAITING_AUTH = 4;
    TlkeHandshakeChannel.STATE_AWAITING_AUTH_RESPONSE = 5;
    TlkeHandshakeChannel.STATE_CONNECTION_ESTABLISHED = 6;
    TlkeHandshakeChannel.STATE_CONNECTION_FAILED = -1;

    return TlkeHandshakeChannel;
});