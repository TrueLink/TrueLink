define([
    "zepto",
    "tools/random",
    "modules/data-types/hex",
    "modules/data-types/bitArray",
    "modules/data-types/base64",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js",
    "modules/cryptography/aes-sjcl",
    "modules/cryptography/diffie-hellman-leemon",
    "modules/converters/sjcl"
], function ($, random, Hex, BitArray, Base64, Bytes, SHA1, Aes, DiffieHellman) {
    "use strict";
    function hash(value) {
        return SHA1(value.as(Hex)).as(BitArray).bitSlice(0, 128);
    }

    app.factory("TlChannel", function (Entity) {

        function TlChannel(entity) {
            this.entity = entity;
            this.pending = false;
            this.controllerName = "TlEstablishController";
            this.transportName = "CouchTransport";
        }

        TlChannel.STATE_NOT_STARTED = 1;
        TlChannel.STATE_AWAITING_OFFER = 2;
        TlChannel.STATE_AWAITING_OFFER_RESPONSE = 3;
        TlChannel.STATE_AWAITING_AUTH = 4;
        TlChannel.STATE_AWAITING_AUTH_RESPONSE = 5;
        TlChannel.STATE_CONNECTION_ESTABLISHED = 6;
        TlChannel.STATE_CONNECTION_FAILED = -1;
        TlChannel.className = "tlE";


        var bitArraySerialize = {
            set: function (data) { return data ? data.as(BitArray) : null; },
            load: function (data) { return data ? new Base64(data).as(BitArray) : null; },
            save: function (value) { return value.as(Base64).value; }
        };
        var byteSerialize = {
            set: function (data) { return data ? data.as(Bytes) : null; },
            load: function (data) { return data ? new Base64(data).as(Bytes) : null; },
            save: function (value) { return value.as(Base64).value; }
        };
        var dhSerialize = {
            load: function (data) { return data ? DiffieHellman.fromData(data) : null; },
            save: function (value) { return value.exportData(); }
        };
        TlChannel.prototype = {
            _cached: {
                inChannelName: bitArraySerialize,
                outChannelName: bitArraySerialize,
                dh: dhSerialize,
                dhAesKey: bitArraySerialize,
                dhk: byteSerialize,
                auth: byteSerialize,
                check: bitArraySerialize
            },
            getId: function () {
                return this.entity.id;
            },
            getData: function (key) {
                if (this._cached.hasOwnProperty(key)) {
                    if (!this.hasOwnProperty(key)) {
                        this[key] = this._cached[key].load(this.entity.getData(key));
                    }
                    return this[key];
                }
                return this.entity.getData(key);
            },
            setData: function (keyOrValue, value) {
                if (value !== undefined && this._cached.hasOwnProperty(keyOrValue)) {
                    var key = keyOrValue;
                    this[key] = this._cached[key].set ? this._cached[key].set(value) : value;
                    this.entity.setData(key, this._cached[key].save(value));
                    return;
                }
                return this.entity.setData(keyOrValue, value);
            },
            getChannelName: function () {
                return this.getData("outChannelName").as(Hex).value;
            },
            getBackChannelName: function () {
                return this.getData("inChannelName").as(Hex).value;
            },
            getState: function () { return this.getData("state"); },


            // data, customKey and return value are multivalues
            encrypt: function (data, customKey) {
                var iv = random.bitArray(128);
                var aes = new Aes(customKey || this.getData("dhAesKey"));
                var encryptedData = aes.encryptCbc(data, iv);
                return iv.as(Bytes).concat(encryptedData);
            },

            // data, customKey and return value are multivalues
            decrypt: function (data, customKey) {
                var dataBitArray = data.as(BitArray);
                var iv = dataBitArray.bitSlice(0, 128);
                var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
                var aes = new Aes(customKey || this.getData("dhAesKey"));
                return aes.decryptCbc(encryptedData, iv);
            },

            // return value is multivalue
            exportDhKe: function () {
                var dhData = new Hex(this.getData("dh").createKeyExchange());
                return this.encrypt(dhData);
            },
            // encryptedKe and return value are multivalues
            acceptDhKe: function (encryptedKe) {
                var dhDataHex = this.decrypt(encryptedKe).as(Hex).value;
                var dhkHex = this.getData("dh").decryptKeyExchange(dhDataHex);
                return new Hex(dhkHex);
            },
            // return is bitArray
            _getVerifiedDhk: function () {
                var dhk = this.getData("dhk").as(Bytes);
                var auth = this.getData("auth").as(Bytes);
                return hash(dhk.concat(auth));
            }
        };
        return TlChannel;
    });
});