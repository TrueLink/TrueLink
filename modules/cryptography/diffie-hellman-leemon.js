"use strict";

var Random = require("./random");
var Hex = require("../multivalue/hex");
var lemon = require("../leemon/BigInt");
var invariant = require("../invariant");

/*
* Uses hex strings for now
* */
function genP() {
    // 1024
    return lemon.str2bigInt(
        "FFFFFFFFFFFFFFFFC90FDAA2" +
        "2168C234C4C6628B80DC1CD1" +
        "29024E088A67CC74020BBEA6" +
        "3B139B22514A08798E3404DD" +
        "EF9519B3CD3A431B302B0A6D" +
        "F25F14374FE1356D6D51C245" +
        "E485B576625E7EC6F44C42E9" +
        "A637ED6B0BFF5CB6F406B7ED" +
        "EE386BFB5A899FA5AE9F2411" +
        "7C4B1FE649286651ECE65381" +
        "FFFFFFFFFFFFFFFF", 16);
}

function genG() {
    return lemon.int2bigInt(22, 5);
}

function genPrivKey(bitLength, random) {
    var rndHex = random.bitArray(bitLength).as(Hex).value;
    return lemon.str2bigInt(rndHex, 16);
}

function bigInt2str(bi) {
    if (!bi) { return null; }
    var str = lemon.bigInt2str(bi, 16);
    if (str.length % 2) {
        str = "0" + str;
    }
    return str;
}

function DiffieHellman() { }

DiffieHellman.prototype = {
    initialize: function (p, g, a) {
        this.p = p;
        this.g = g;
        this.a = a;
    },
    serialize: function () {
        return {
            p: bigInt2str(this.p),
            g: bigInt2str(this.g),
            a: bigInt2str(this.a)
        };
    },
    _deserialize: function (dto) {
        this.p = dto.p ? lemon.str2bigInt(dto.p, 16) : null;
        this.g = dto.g ? lemon.str2bigInt(dto.g, 16) : null;
        this.a = dto.a ? lemon.str2bigInt(dto.a, 16) : null;
    },
    createKeyExchange: function () {
        var keyEx = lemon.powMod(this.g, this.a, this.p);
        return bigInt2str(keyEx);
    },
    decryptKeyExchange: function (keyEx) {
        var keyExInt = lemon.str2bigInt(keyEx, 16);
        var dhKey = lemon.powMod(keyExInt, this.a, this.p);
        return bigInt2str(dhKey);
    }
};
DiffieHellman.generate = function (privKeyBitLength, rnd) {
    invariant(rnd, "No rng provided");
    invariant(rnd instanceof Random, "No valid rng provided");
    var dh = new DiffieHellman();
    dh.initialize(genP(), genG(), genPrivKey(privKeyBitLength, rnd));
    return dh;
};

DiffieHellman.deserialize = function (dto) {
    var dh = new DiffieHellman();
    dh._deserialize(dto);
    return dh;
};

module.exports = DiffieHellman;

