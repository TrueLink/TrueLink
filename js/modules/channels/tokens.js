define(["modules/data-types/hex"], function (Hex) {
    "use strict";
    var tokens = {
        TlkeChannel: {},
        TlChannel: {},
        ContactChannelGroup: {}
    };
    tokens.TlkeChannel.GenerateToken = function () {};
    tokens.TlkeChannel.OfferToken = function (offerBytes) { this.offer = offerBytes; };
    tokens.TlkeChannel.OfferToken.prototype = {
        serialize: function () {
            return {
                o: this.offer.as(Hex).serialize()
            };
        },
        _typeName: "10"
    };
    tokens.TlkeChannel.OfferToken.deserialize = function (dto) {
        var offer = Hex.deserialize(dto.o);
        return new tokens.TlkeChannel.OfferToken(offer);
    };
    tokens.TlkeChannel.AuthToken = function (authBytes) { this.auth = authBytes; };
    tokens.TlkeChannel.AuthToken.prototype = {
        serialize: function () {
            return {
                a: this.auth.as(Hex).serialize()
            };
        },
        _typeName: "15"
    };
    tokens.TlkeChannel.AuthToken.deserialize = function (dto) {
        var auth = Hex.deserialize(dto.a);
        return new tokens.TlkeChannel.AuthToken(auth);
    };

    tokens.TlkeChannel.ChangeStateToken = function (state) { this.state = state; };
    tokens.TlkeChannel.TlkeChannelGeneratedToken = function (inId, outId) {
        this.inId = inId;
        this.outId = outId;
    };
    tokens.TlkeChannel.TlChannelGeneratedToken = function (inId, outId, key) {
        this.inId = inId;
        this.outId = outId;
        this.key = key;
    };

    tokens.TlChannel.WrongSignatureToken = function (msg) { this.msg = msg; };
    tokens.TlChannel.ExpiresToken = function () {  };
    tokens.TlChannel.ExpiredToken = function () {  };



    var types = {}, type, group;
    for (group in tokens) {
        if (tokens.hasOwnProperty(group)) {
            for (type in tokens[group]) {
                if (tokens[group].hasOwnProperty(type)) {
                    var name = tokens[group][type].prototype._typeName;
                    if (name) {
                        types[name] = tokens[group][type];
                    }
                }
            }
        }
    }


    tokens.serialize = function (token) {
        if (!token._typeName) {
            throw new Error("Could not serialize token: missing prototype._typeName");
        }
        return {
            ct: token._typeName,
            d: token.serialize()
        };
    };

    tokens.deserialize = function (dto) {
        return types[dto.t].deserialize(dto.d);
    };


    return tokens;
});
