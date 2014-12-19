"use strict";

var SHA1 = require("modules/cryptography/sha1-crypto-js");

var invariant = require("invariant");

var multivalue = require("Multivalue");
var Multivalue = multivalue.multivalue.Multivalue;
var Hex = multivalue.Hex;
var BitArray = require("Multivalue/multivalue/bitArray");
var Bytes = require("Multivalue/multivalue/bytes");

var hashtail = {};

hashtail.hashCount = 1000;
hashtail.hashLength = 128;
hashtail.minHashtailsWanted = 3;

var hash = function (value) {
    return SHA1(value).as(BitArray).bitSlice(0, hashtail.hashLength);
}




Validator.deserialize = function (data) {
    var validator = new Validator();

    validator._counter = data.counter;
    validator._end = data.end ? Hex.deserialize(data.end) : null;
    validator._current = data.current ? Hex.deserialize(data.current) : null; 

    return validator;
}

function Validator(end) {
    if (end) {
        invariant(end instanceof Multivalue, "end must be multivalue");
        this._end = end.as(Hex);
        this._current = this._end;
        this._counter = hashtail.hashCount;        
    } else {
        // going to be deserialized
        this._end = null;
        this._counter = null;
        this._current = null;
    }
}

Validator.prototype.serialize = function () {
    return {
        counter: this._counter,
        end: this._end ? this._end.as(Hex).serialize() : null,
        current: this._current ? this._current.as(Hex).serialize() : null
    };
}

// mutates Validator!
Validator.prototype.isHashValid = function (hx) {
    invariant(hx instanceof Multivalue, "hash must be multivalue");
    var hashhx = hash(hx);
    if (hashhx.as(Hex).isEqualTo(this._current.as(Hex))) {
        this._current = hx.as(Hex);
        this._counter--;
        return true;
    }

    return false;
}



Generator.deserialize = function (data) {
    var generator = new Generator();

    generator._active = data.active;
    generator._owner = data.owner;
    generator._start = data.start ? Hex.deserialize(data.start) : null;
    generator._counter = data.counter;

    return generator;
}

function Generator(args) {
    this._cache = null;

    if (args) {
        this._active = !args.inactive;
        this._owner = args.owner;
        this._start = args.start.as(Hex);
        this._counter = args.counter || hashtail.hashCount;
    } else {
        // going to be deserialized
        this._active = false;
        this._owner = null;
        this._start = null;
        this._counter = null;
    }
}

Generator.prototype.serialize = function () {
    return {
        active: this._active,
        owner: this._owner,
        start: this._start ? this._start.as(Hex).serialize() : null,
        counter: this._counter
    };
}

Generator.prototype.update = function (args) {
    this._active = true;
    this._owner = args.owner;
    this._counter = args.counter;
}

Generator.prototype.isActiveAndOwnedBy = function (owner) {
    return this._active && this._start && this._counter > 1 && this._owner === owner;
}

Generator.prototype.activate = function () {
    this._active = true;
}

// returns data to be sent to delegation target
Generator.prototype.delegate = function (newOwner) {
    this._owner = newOwner;
    return {
        owner: this._owner,
        start: this._start,
        counter: this._counter
    };
}

Generator.prototype.isItYou = function (start) {
    invariant(start && (start instanceof Multivalue), "end must be multivalue");
    
    // start is used as id
    if (this._start) { return this._start.as(Hex).isEqualTo(start.as(Hex)); }
    
    return false;
}

Generator.prototype.getEnd = function () {
    return this._getHash(hashtail.hashCount); 
}

// mutates generator!
Generator.prototype.getNextHash = function () {
    this._counter--;
    return this._getHash(this._counter);
}

Generator.prototype._getHash = function (counter) {
    // populate cache first (if needed)
    if (!this._cache) {
        this._cache = [];
    }
    var cache = this._cache;
    if (!cache[counter]) {
        var hx = cache[1] = this._start;
        for (var i = 2; i <= counter; i++) {
            hx = cache[i] = hash(hx);
        }  
    }

    return cache[counter];
}



GeneratorPool.deserialize = function (random, data) {
    var pool = new GeneratorPool(random);

    pool._thisOwner = data.thisOwner;
    pool._pool = data.pool.map(function (hg) {
        return Generator.deserialize(hg);
    });

    return pool;
}

GeneratorPool.getFirstHash = function () {
    return new Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function GeneratorPool(random, args) {
    this._random = random;
    if (args) {
        this._thisOwner = args.profileId;
        this._pool = [];
    } else {
        this._thisOwner = null;
        this._pool = null;
    }
}

GeneratorPool.prototype.serialize = function () {
    return {
        thisOwner: this._thisOwner,
        pool: this._pool.map(function (hg) {
            return hg.serialize();
        })
    }
}

GeneratorPool.prototype._getCowriterActiveHashes = function (owner) {
    return this._pool.filter(function (hg) {
        return hg.isActiveAndOwnedBy(owner); 
    }.bind(this));  
}

GeneratorPool.prototype._getMyActiveHashes = function () {
    return this._getCowriterActiveHashes(this._thisOwner); 
}

GeneratorPool.prototype._chooseHashtail = function () {
    var myHashes = this._getMyActiveHashes();
    invariant(myHashes.length, "Cannot choose hashtail: I have none");

    var hashIndex = Math.floor(this._random.double() * myHashes.length);
    return myHashes[hashIndex];
}

GeneratorPool.prototype.delegateGenerator = function (newOwnerId) {
    return this._chooseHashtail().delegate(newOwnerId);
}

GeneratorPool.prototype.processDelegatedGenerator = function (hashInfo) {
    var existingHashInfoArr = this._pool.filter(function (hg) {
        return hg.isItYou(hashInfo.start);
    });

    if (existingHashInfoArr.length) {        
        existingHashInfoArr[0].update(hashInfo);
    } else {
        this._pool.push(new Generator(hashInfo));
    }
}

GeneratorPool.prototype.getNextHash = function () {
    return this._chooseHashtail().getNextHash();
}

GeneratorPool.prototype.areAnyHashesAvailable = function () {
    return this._getMyActiveHashes().length !== 0;
}

GeneratorPool.prototype.areEnoughHashtailsAvailable = function () {
    return this._getMyActiveHashes().length >= hashtail.minHashtailsWanted;
}

GeneratorPool.prototype.createGenerator = function () {
    var start = this._random.bitArray(hashtail.hashLength);
    var hg = new Generator({
        start: start,
        owner: this._thisOwner,
        inactive: true
    });

    this._pool.push(hg);

    return {
        end: hg.getEnd(),
        activator: hg.activate.bind(hg)
    };
}

hashtail.Validator = Validator;
hashtail.GeneratorPool = GeneratorPool;
module.exports = hashtail;