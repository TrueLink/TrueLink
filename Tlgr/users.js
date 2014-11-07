"use strict";

var rsa = require("../modules/cryptography/rsa-forge");

var eventEmitter = require("../modules/events/eventEmitter");
var invariant = require("../modules/invariant");

var Multivalue = require("../modules/multivalue/multivalue");
var Hex = require("../modules/multivalue/hex");


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
        result[key] = {
            aid: byAid[key].aid.as(Hex).serialize(),
            ht: byAid[key].ht.as(Hex).serialize(),
            publicKey: byAid[key].publicKey.serialize(),
            meta: byAid[key].meta
        }
    }
    return result;
}

Users.prototype.deserialize = function (byAid) {
    for (var key in byAid) {
        this._byAid[key] = { 
            aid: Hex.deserialize(byAid[key].aid),
            ht: Hex.deserialize(byAid[key].ht),
            meta: byAid[key].meta,
            publicKey: rsa.PublicKey.deserialize(byAid[key].publicKey)
        }
    }
}

module.exports = Users;
