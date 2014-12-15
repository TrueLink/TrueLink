"use strict";

var rsa = require("modules/cryptography/rsa-forge");

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");

var hashtail = require("./hashtail");

var invariant = require("invariant");



User.deserialize = function (data) {
    var user = new User();

    this._aid = Hex.deserialize(data.aid);
    this._hashValidators = data.hashValidators.map(function (hv) {
            return hashtail.Validator.deserialize(hv);
        });
    this._publicKey = rsa.PublicKey.deserialize(data.publicKey);
    this._meta = data.meta;

    return user;
}

function User(args) {
    if (args) {
        this._aid = args.aid;
        this._publicKey = args.publicKey;
        this._meta = args.meta;
        this._hashValidators = [new hashtail.Validator(args.ht)];
    } else {
        // going to be deserialized
        this._aid = null;
        this._publicKey = null;
        this._meta = null;
        this._hashValidators = null;
    }
}

User.prototype.serialize = function () {
    return {
        aid: this._aid.as(Hex).serialize(),
        hashValidators: this._hashValidators.map(function (hv) {
                return hv.serialize();
            }),
        publicKey: this._publicKey.serialize(),
        meta: this._meta
    };
}

User.prototype.isHashValid = function (hx) {
    return this._hashValidators.some(function (hv) { return hv.isHashValid(hx); });
}

User.prototype.getInfo = function () {
    return {
        aid: this._aid,
        meta: this._meta,
        publicKey: this._publicKey
    }
}

User.prototype.getMeta = function () {
    return this._meta;
}

User.prototype.addHashtail = function (ht) {
    this._hashValidators.push(new hashtail.Validator(ht));
}






function Users() {
    this._byAid = {};
}

Users.prototype.getUsers = function () {
    return Object.keys(this._byAid).map(function (item) {
        return {
            aid: item,
            name: this._byAid[item].getMeta().name
        }
    }, this);
};

Users.prototype.getUserData = function (aid) {
    if (aid instanceof Multivalue) {
        aid = aid.as(Hex).serialize();
    }
    invariant(typeof aid === 'string' || aid instanceof String, "aid should be Multivalue or string");
    //todo check what exactly should be returned here
    return this._byAid[aid].getInfo();
}

Users.prototype.putUserData = function (data) {
    this._byAid[data.aid.as(Hex).serialize()] = new User(data);
}

Users.prototype.removeUserData = function (data) {
    delete this._byAid[data.aid.as(Hex).serialize()];
}

Users.prototype.findUserByHash = function (hx) {
    for (var aid in this._byAid) {
        var user = this._byAid[aid];
        if (user.isHashValid(hx)) {
            //todo check what exactly should be returned here
            return user.getInfo();
        }
    }
}

Users.prototype.addHashtail = function (userAid, ht) {
    this._byAid[userAid.as(Hex).serialize()].addHashtail(ht);
}

Users.prototype.serialize = function () {
    var result = {};
    for (var key in byAid) {
        result[key] = this._byAid[key].serialize();
    }
    return result;
}

Users.prototype.deserialize = function (byAid) {
    for (var key in byAid) {
        this._byAid[key] = User.deserialize(byAid[key]);
    }
}

module.exports = Users;
