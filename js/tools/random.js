define([
    "modules/data-types/bytes",
    "modules/data-types/bitArray",
    "modules/data-types/bigIntSjcl",
    "modules/sjcl/bn",
    "modules/sjcl/bitArray",
    "modules/sjcl/random",
    "tools/urandom"], function (Bytes, BitArray, BigInt, Bn, Ba, Random, urandom) {
    "use strict";

    var random = new Random(8);

    function mouseCollector(e) {
        var ev = e.changedTouches ? e.changedTouches[0] : e;
        var x = ev.x || ev.clientX || ev.offsetX || 0, y = ev.y || ev.clientY || ev.offsetY || 0;
        random.addEntropy([x, y], 2, "mouse");
    }
    try {
        // get cryptographically strong entropy in Webkit
        var ab = new Uint32Array(32);
        crypto.getRandomValues(ab);
        random.addEntropy(ab, 1024, "crypto.getRandomValues");
    } catch (e) {
        // nope, we don't have any good suitable values
    }
    // even more entropy. TODO what's with performance?
    ["MSPointerMove", "touchmove", "mousemove", "mousedown", "touchstart"].map(function (evtName) {
        if (window.addEventListener) {
            window.addEventListener(evtName, mouseCollector, false);
        } else if (document.attachEvent) {
            document.attachEvent(evtName, mouseCollector);
        }
    });

    function getRandomWords(bitLength) {
        // TODO ACHTUNG this is temp solution!
        if (!random.isReady()) {
            random.addEntropy(urandom.bytes(128), 1024, "fake");
            console.warn("Fortuna is seeded with fake entropy!");
        }
        var byteLength = (bitLength / 32) + (bitLength % 32 ? 1 : 0);
        var words = random.randomWords(byteLength);
        return words;
    }

    return {
        bitArray: function (bitLength) {
            var ba = new BitArray(getRandomWords(bitLength));
            if (bitLength % 32) {
                ba = ba.bitSlice(0, bitLength);
            }
            return ba;
        },
        bigInteger: function (bitLength) {
            return new BigInt(Bn.fromBits(getRandomWords(bitLength)));
        },
        double: function () {
            var rndInt = getRandomWords(32)[0] + 0x80000000;
            var double = rndInt * 2.3283064365386963e-10;
            return double;
        }

    };

});