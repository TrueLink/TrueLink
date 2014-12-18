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
    this._byAid = Object.create(null);
}

Users.prototype._getUser = function (aid /*string or Multivalue*/) {
    if (aid instanceof Multivalue) {
        aid = aid.as(Hex).serialize();
    }
    invariant(typeof aid === 'string', "aid should be Multivalue or string");
    return this._byAid[aid];
}

Users.prototype._setUser = function (aid /*string or Multivalue*/, value /*User*/) {
    if (aid instanceof Multivalue) {
        aid = aid.as(Hex).serialize();
    }
    invariant(typeof aid === 'string', "aid should be Multivalue or string");
    invariant(value instanceof User, "value should be User");
    if (value) {
        this._byAid[aid] = value;
    } else {
        delete this._byAid[aid];
    }
}




Users.prototype.getUserData = function (aid) {
    //todo check what exactly should be returned here
    return this._getUser(aid).getInfo();
}

Users.prototype.getUsers = function () {
    return Object.keys(this._byAid).map(function (aid) {
        return {
            aid: aid,
            name: this._byAid[aid].getMeta().name
        }
    }, this);
};

// puts user and returns 'true' if it is unknown.
// updates it (adds ht) and returns 'false' otherwise.
Users.prototype.putUserData = function (data) {
    var user = this._getUser(data.aid);
    if (user) {
        user.addHashtail(data.ht);
        return false;
    } else {
        this._setUser(data.aid, new User(data));
        return true;
    }
}

Users.prototype.removeUserData = function (data) {
    this._setUser(data.aid);
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

Users.prototype.addHashtail = function (aid, ht) {
    this._getUser(aid).addHashtail(ht);
}

Users.prototype.serialize = function () {
    var result = {};
    for (var aid in this._byAid) {
        result[aid] = this._getUser(aid).serialize();
    }
    return result;
}

Users.prototype.deserialize = function (byAid) {
    for (var aid in byAid) {
        this._setUser(aid, User.deserialize(byAid[aid]));
    }
}

module.exports = Users;
