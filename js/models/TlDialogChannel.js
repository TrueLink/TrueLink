define([
    "zepto",
    "tools/random",
    "modules/data-types/hex",
    "modules/data-types/bitArray",
    "modules/data-types/Base64",
    "modules/data-types/bytes",
    "modules/cryptography/sha1-crypto-js",
    "modules/cryptography/aes-sjcl",
    "modules/converters/sjcl"
], function ($, random, Hex, BitArray, Base64, Bytes, SHA1, Aes) {
    "use strict";
    app.factory("TlDialogChannel", function () {

        function TlDialogChannel(entity) {
            this.entity = entity;
            this.pending = false;
            this.controllerName = "TlChatController";
            this.transportName = "CouchTransport";
        }
        TlDialogChannel.className = "tlC";
        TlDialogChannel.MSG_TYPE_CHAT = "c";
        TlDialogChannel.MSG_TYPE_HASH = "h";


        var bitArraySerialize = {
            set: function (data) { return data ? data.as(BitArray) : null; },
            load: function (data) { return data ? new Base64(data).as(BitArray) : null; },
            save: function (value) { return value.as(Base64).value; }
        };
        var hexSerialize = {
            set: function (data) { return data ? data.as(Hex) : null; },
            load: function (data) { return data ? new Base64(data).as(Hex) : null; },
            save: function (value) { return value.as(Base64).value; }
        };
        TlDialogChannel.prototype = {
            _cached: {
                inChannelName: bitArraySerialize,
                outChannelName: bitArraySerialize,
                channelKey: bitArraySerialize,
                hashStart: hexSerialize,
                backHashEnd: hexSerialize
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

            // data and return value are multivalues
            encrypt: function (data) {
                var iv2 = random.bitArray(128);
                var aes = new Aes(this.getData("channelKey"));
                var maskedHashEnd = aes.encryptCbc(data, iv2);
                return iv2.as(Bytes).concat(maskedHashEnd.as(Bytes));
            },

            // data and return value are multivalues
            decrypt: function (data) {
                var dataBitArray = data.as(BitArray);
                var iv = dataBitArray.bitSlice(0, 128);
                var encryptedData = dataBitArray.bitSlice(128, dataBitArray.bitLength());
                var aes = new Aes(this.getData("channelKey"));
                return aes.decryptCbc(encryptedData, iv);
            }
        };
        return TlDialogChannel;
    });
});