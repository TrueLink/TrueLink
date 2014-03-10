define([
    "tools/random",
    "modules/data-types/hex",
    "modules/leemon/BigInt"], function (random, Hex, lemon) {
    "use strict";

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

    function genPrivKey(bitLength) {
        var rndHex = random.bitArray(bitLength).as(Hex).value;
        return lemon.str2bigInt(rndHex, 16);
    }

    function bigInt2str(bi) {
        var str = lemon.bigInt2str(bi, 16);
        if (str.length % 2) {
            str = "0" + str;
        }
        return str;
    }

    function DiffieHellman(privKeyBitLength) {
        if (privKeyBitLength) {
            this._initialize(genP(), genG(), genPrivKey(privKeyBitLength));
        }
    }

    DiffieHellman.prototype = {
        _initialize: function (p, g, a) {
            this.p = p;
            this.g = g;
            this.a = a;
        },
        exportData: function () {
            return {/* we use static:
             p: bigInt2str(this.p),
             g: bigInt2str(this.g),*/
                a: bigInt2str(this.a)
            };
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

    DiffieHellman.fromData = function (dhData) {
        var dh = new DiffieHellman();
        dh._initialize(
            dhData.p ? lemon.str2bigInt(dhData.p, 16) : genP(),
            dhData.g ? lemon.str2bigInt(dhData.g, 16) : genG(),
            lemon.str2bigInt(dhData.a, 16)
        );
        return dh;
    };

    return DiffieHellman;
});
