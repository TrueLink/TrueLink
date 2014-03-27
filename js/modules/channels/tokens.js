define(["modules/data-types/hex"], function (Hex) {
    "use strict";
    var tokens = {
        TlkeChannel: {},
        GenericChannel: {},
        ContactChannelGroup: {}
    };
    tokens.TlkeChannel.GenerateToken = function () {};
    tokens.TlkeChannel.OfferToken = function (offerBytes) { this.offer = offerBytes; };
    tokens.TlkeChannel.OfferToken.prototype = {
        serialize: function () {
            return this.offer.as(Hex).serialize();
        },
        _typeName: "10"
    };
    tokens.TlkeChannel.OfferToken.deserialize = function (dto) {
        return new tokens.TlkeChannel.OfferToken(Hex.deserialize(dto));
    };
    tokens.TlkeChannel.AuthToken = function (authBytes) { this.auth = authBytes; };
    tokens.TlkeChannel.AuthToken.prototype = {
        serialize: function () {
            return this.auth.as(Hex).serialize();
        },
        _typeName: "15"
    };
    tokens.TlkeChannel.AuthToken.deserialize = function (dto) {
        return new tokens.TlkeChannel.AuthToken(Hex.deserialize(dto));
    };
    tokens.TlkeChannel.ChangeStateToken = function (state) { this.state = state; };
    // do not change these properties! (kind of IChannelChangedIdsToken)
    tokens.TlkeChannel.TlkeChannelGeneratedToken = function (inId, outId) {
        this.inId = inId;
        this.outId = outId;
    };
    // do not change these properties! (kind of IChannelChangedIdsToken)
    tokens.TlkeChannel.GenericChannelGeneratedToken = function (inId, outId, key) {
        this.inId = inId;
        this.outId = outId;
        this.key = key;
    };

    tokens.GenericChannel.WrongSignatureToken = function (msg) { this.msg = msg; };
    tokens.GenericChannel.ExpiresToken = function () {  };
    tokens.GenericChannel.ExpiredToken = function () {  };

    tokens.ContactChannelGroup.GenerateTlkeToken = function (context) { this.context = context; };
    tokens.ContactChannelGroup.OfferToken = function (offer) { this.offer = offer; };
    tokens.ContactChannelGroup.AuthToken = function (auth) { this.auth = auth; };
    tokens.ContactChannelGroup.ChannelAddedToken = function (inId) { this.inId = inId; };
    tokens.ContactChannelGroup.ChangeStateToken = function (state) { this.state = state; };

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
            t: token._typeName,
            d: token.serialize()
        };
    };

    tokens.deserialize = function (dto) {
        return types[dto.t].deserialize(dto.d);
    };


    return tokens;
});
