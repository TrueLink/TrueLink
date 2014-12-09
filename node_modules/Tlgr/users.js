"use strict";

var rsa = require("modules/cryptography/rsa-forge");

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");


function Users() {
    this._byAid = {};
}

Users.prototype.getUsers = function () {
    return Object.keys(this._byAid).map(function (item) {
        return {
            aid: item,
            name: this._byAid[item].meta.name
        }
    }, this);
};

Users.prototype.getUserData = function (aid) {
    if (aid instanceof Multivalue) {
        return this.getUserData(aid.as(Hex).serialize());
    }
    if (typeof aid === 'string' || aid instanceof String) {
        return this._byAid[aid];
    }
}

Users.prototype.putUserData = function (data) {
    this._byAid[data.aid.as(Hex).serialize()] = data;
}

Users.prototype.removeUserData = function (data) {
    delete this._byAid[data.aid.as(Hex).serialize()];
}

Users.prototype.findUserByHash = function (hx) {
    var hex = hx.as(Hex);
    for (var index in this._byAid) {
        var user = this._byAid[index];
        if (user.ht.as(Hex).isEqualTo(hex)) {
            return user;
        }
    }
}

Users.prototype.serialize = function () {
    var byAid = this._byAid;
    var result = {};
    for (var key in byAid) {
        var user = byAid[key];
        result[key] = {
            aid: user.aid.as(Hex).serialize(),
            ht: user.ht.as(Hex).serialize(),
            htCounter: user.htCounter,
            publicKey: user.publicKey.serialize(),
            meta: user.meta
        }
    }
    return result;
}

Users.prototype.deserialize = function (byAid) {
    for (var key in byAid) {
        var user = byAid[key];
        this._byAid[key] = { 
            aid: Hex.deserialize(user.aid),
            ht: Hex.deserialize(user.ht),
            htCounter: user.htCounter,
            meta: user.meta,
            publicKey: rsa.PublicKey.deserialize(user.publicKey)
        }
    }
}

module.exports = Users;
