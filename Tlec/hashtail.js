"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");

var invariant = require("invariant");

var multivalue = require("Multivalue");
var Multivalue = multivalue.multivalue.Multivalue;
var Hex = multivalue.Hex;
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");


Hashtail.HashCount = 1000;

Hashtail.deserialize = function (data) {
    var hashtail = new Hashtail();
    hashtail._active = data.active;
    hashtail._owner = data.owner;
    hashtail._start = data.start ? Hex.deserialize(data.start) : null;
    hashtail._hashCounter = data.hashCounter;

    hashtail._checkCounter = data.checkCounter;
    hashtail._end = data.start ? Hex.deserialize(data.end) : null;
    hashtail._current = data.start ? Hex.deserialize(data.current) : null; 

    return hashtail;
}

Hashtail.isFirstHashValid = function (hash) {
    invariant(hash, "hash must be multivalue");
    
    return hash.as(Hex).value === "00000000000000000000000000000000";
}

Hashtail.getFirstHash = function () {
    return new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

Hashtail.hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, 128);
}


function Hashtail() {
    this._active = false;
    this._owner = null;
    this._start = null;
    this._cache = null;
    this._hashCounter = null;

    this._checkCounter = null;
    this._end = null;
    this._current = null;
}

Hashtail.prototype.serialize = function () {
    return {
        active: this._active,
        owner: this._owner,
        stat: this._start ? this._start.as(Hex).serialize() : null,
        hashCounter: this._hashCounter,

        checkCounter: this._checkCounter,
        end: this._end ? this._end.as(Hex).serialize() : null,
        current: this._current ? this._current.as(Hex).serialize() : null,
    };
}

Hashtail.prototype.isActiveAndOwnedBy = function (owner) {
    return this._active && this._start && this._hashCounter > 1 && this._owner === owner;
}

Hashtail.prototype.activate = function () {
    this._active = true;
}

// returns data to be sent to delegation target
Hashtail.prototype.delegate = function (newOwner) {
    this._owner = newOwner;
    return {
        owner: this._owner,
        start: this._start,
        hashCounter: this._hashCounter,

        end: this._end // used for identification
    };
}

Hashtail.prototype.isItYou = function (end) {
    invariant(this._end, "hashtail has no end");
    invariant(end && (end instanceof Multivalue), "end must be multivalue");
    
    // end is used as id
    if (this._end) { return this._end.as(Hex).isEqualTo(end.as(Hex)); }
    
    return false  
}

Hashtail.prototype.initWithStart = function (hashInfo, inactive) {
    invariant(!this._start || this._start.as(Hex).isEqualTo(hashInfo.start.as(Hex)), 
        "cannot initWithStart: start is already set and differs"); 

    this._active = !inactive;
    this._owner = hashInfo.owner;
    this._start = hashInfo.start.as(Hex);
    this._hashCounter = hashInfo.hashCounter || Hashtail.HashCount;

    if (!this._end) {
        this._populateCache(Hashtail.HashCount);
        this._end = this._cache[Hashtail.HashCount]; // end should be set, as it is used as identifier
    }

    return this._end;
}

Hashtail.prototype.initWithEnd = function (end) {
    this._end = end.as(Hex);
    this._current = this._end;
    this._checkCounter = Hashtail.HashCount;
}

// mutates hashtail!
Hashtail.prototype.isHashValid = function (hash) {
    invariant(hash, "hash must be multivalue");

    if (!this._current) {
        // hashtail was generated or delegated, but did not come from channel yet
        return false;
    }

    var hashhash = Hashtail.hash(hash);
    if (hashhash.as(Hex).isEqualTo(this._current.as(Hex))) {
        this._current = hash.as(Hex);
        this._checkCounter--;
        return true;
    }
    return false;
}

// mutates hashtail!
Hashtail.prototype.getNextHash = function () {
    invariant(this._start, "cannot get hash: start is not set");

    this._hashCounter--;
    this._populateCache(this._hashCounter);
    return this._cache[this._hashCounter];
}

Hashtail.prototype._populateCache = function (counter) {
    if (!this._cache) {
        this._cache = [];
    }
    var cache = this._cache;

    if (!cache[counter]) {
        var hx = cache[1] = this._start;
        for (var i = 2; i <= counter; i++) {
            hx = cache[i] = Hashtail.hash(hx);
        }  
    }
}

module.exports = Hashtail;