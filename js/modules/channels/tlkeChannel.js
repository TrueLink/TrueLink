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
    function TlkeChannel() {
        this.state = TlkeChannel.STATE_NOT_STARTED;
    }

    TlkeChannel.prototype = new Channel();
    $.extend(TlkeChannel.prototype, {
        enterToken: function (token, context) {
            if (token instanceof TlkeChannel.GenerateToken) {
                this._generateOffer();
            } else if (token instanceof TlkeChannel.OfferToken) {
                this._acceptOffer(token.offer);
            } else if (token instanceof TlkeChannel.AuthToken) {
                this._acceptAuth(token.auth);
            }
            this._notifyDirty();
        },
        processPacket: function (bytes) {
            switch (this.state) {
            case TlkeChannel.STATE_AWAITING_OFFER_RESPONSE:
                this._acceptOfferResponse(bytes);
                break;
            case TlkeChannel.STATE_AWAITING_AUTH_RESPONSE:
                this._acceptAuthResponse(bytes);
                break;
            case TlkeChannel.STATE_AWAITING_OFFER:
                this._acceptOfferData(bytes);
                break;
            case TlkeChannel.STATE_AWAITING_AUTH:
                this._acceptAuthData(bytes);
                break;
            default:
                break;
            }
            this._notifyDirty();
        },

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
            var outId = dhAes.bitSlice(0, 16);
            var inId = dhAes.bitSlice(16, 32);
            this._emitPrompt(new TlkeChannel.TlkeChannelGeneratedToken(inId, outId));
            this.state = TlkeChannel.STATE_AWAITING_OFFER_RESPONSE;
            this._onChangeState();
            this._sendPacket(this._getOfferData());
            this._emitPrompt(new TlkeChannel.OfferToken(this.dhAesKey));
        },

        // Bob 2.1 (instantiation) offer is from getOffer (via IM)
        _acceptOffer: function (offer) {
            this.dh = new DiffieHellman(dhPrivBitLength, this.random);
            var dhAes = offer.as(Hex).as(BitArray);
            this.dhAesKey = dhAes;
            var inId = dhAes.bitSlice(0, 16);
            var outId = dhAes.bitSlice(16, 32);
            this._emitPrompt(new TlkeChannel.TlkeChannelGeneratedToken(inId, outId));
            this.state = TlkeChannel.STATE_AWAITING_OFFER;
            this._onChangeState();
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
            this.state = TlkeChannel.STATE_AWAITING_AUTH;
            this._onChangeState();
            this._sendPacket(this._getOfferResponse());
            this._emitPrompt(new TlkeChannel.AuthToken(), null);
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
            this.state = TlkeChannel.STATE_AWAITING_AUTH_RESPONSE;
            this._onChangeState();
            this._sendPacket(this._getAuthData());
            this._emitPrompt(new TlkeChannel.AuthToken(this.auth));
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
            this.state = TlkeChannel.STATE_CONNECTION_ESTABLISHED;
            this._onChangeState();
            this._sendPacket(this._getAuthResponse());
            var hCheck = hash(this.check);
            this._emitPrompt(new TlkeChannel.GenericChannelGeneratedToken(
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
                this.state = TlkeChannel.STATE_CONNECTION_FAILED;
                this._onChangeState();
                return;
            }
            this.state = TlkeChannel.STATE_CONNECTION_ESTABLISHED;
            this._onChangeState();
            this._emitPrompt(new TlkeChannel.GenericChannelGeneratedToken(
                hCheck.bitSlice(16, 32),
                hCheck.bitSlice(0, 16),
                hash(this.check.as(Bytes).concat(verified))
            ));
        },

        _onChangeState: function () {
            this._emitPrompt(new TlkeChannel.ChangeStateToken(this.state));
        }
    });

    TlkeChannel.deserialize = function (dto) {
        throw new Error("Not implemented");
    };

    TlkeChannel.GenerateToken = function () {};
    TlkeChannel.OfferToken = function (offerBytes) { this.offer = offerBytes; };
    TlkeChannel.OfferToken.prototype.serialize = function () {
        return this.offer.as(Hex).serialize();
    };
    TlkeChannel.OfferToken.deserialize = function (dto) {
        return TlkeChannel.AuthToken(Hex.deserialize(dto));
    };
    TlkeChannel.AuthToken = function (authBytes) { this.auth = authBytes; };
    TlkeChannel.AuthToken.prototype.serialize = function () {
        return this.auth.as(Hex).serialize();
    };
    TlkeChannel.AuthToken.deserialize = function (dto) {
        return TlkeChannel.AuthToken(Hex.deserialize(dto));
    };
    TlkeChannel.ChangeStateToken = function (state) { this.state = state; };
    TlkeChannel.TlkeChannelGeneratedToken = function (inId, outId) {
        this.inId = inId;
        this.outId = outId;
    };
    TlkeChannel.GenericChannelGeneratedToken = function (inId, outId, key) {
        this.inId = inId;
        this.outId = outId;
        this.key = key;
    };

    TlkeChannel.STATE_NOT_STARTED = 1;
    TlkeChannel.STATE_AWAITING_OFFER = 2;
    TlkeChannel.STATE_AWAITING_OFFER_RESPONSE = 3;
    TlkeChannel.STATE_AWAITING_AUTH = 4;
    TlkeChannel.STATE_AWAITING_AUTH_RESPONSE = 5;
    TlkeChannel.STATE_CONNECTION_ESTABLISHED = 6;
    TlkeChannel.STATE_CONNECTION_FAILED = -1;

    return TlkeChannel;
});