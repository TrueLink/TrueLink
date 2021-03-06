"use strict";

var rsa = require("modules/cryptography/rsa-forge");

var Multivalue = require("Multivalue").multivalue.Multivalue;
var Hex = require("Multivalue/multivalue/hex");

var hashtail = require("./hashtail");

var invariant = require("invariant");



User.deserialize = function (data) {
    var user = new User();

    user._aid = Hex.deserialize(data.aid);
    user._hashValidators = data.hashValidators.map(function (hv) {
            return hashtail.Validator.deserialize(hv);
        });
    user._publicKey = rsa.PublicKey.deserialize(data.publicKey);
    user._meta = data.meta;

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
    invariant(!value || value instanceof User, "value should be User");
    if (value) {
        this._byAid[aid] = value;
    } else {
        delete this._byAid[aid];
    }
}




Users.prototype.getUserData = function (aid) {
    //todo check what exactly should be returned here
    var user = this._getUser(aid);
    return user && user.getInfo();
}

Users.prototype.getUsers = function () {
    return Object.keys(this._byAid).map(function (aid) {
        return {
            aid: aid,
            name: this._byAid[aid].getMeta().name
        }
    }, this);
};

// puts user if it is unknown.
// updates it (adds ht) otherwise.
Users.prototype.putUserData = function (data) {
    var user = this._getUser(data.aid);
    var isNewUser = !user;
    if (user) {
        user.addHashtail(data.ht);
    } else {
        this._setUser(data.aid, user = new User(data));
    }
    return {
        isNewUser: isNewUser,
        user: user.getInfo()
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
