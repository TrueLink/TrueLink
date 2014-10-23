define(function (require, exports, module) {
    "use strict";

    var Bytes = require("../multivalue/bytes");
    var BitArray = require("../multivalue/bitArray");
    var BigInt = require("../multivalue/bigIntSjcl");
    var Bn = require("../sjcl/bn");
    var Ba = require("../sjcl/bitArray");
    var RandomSjcl = require("../sjcl/random");
    var urandom = require("../urandom/urandom");
    var serializable = require("../serialization/serializable");
    var eventEmitter = require("../events/eventEmitter");

    var extend = require("../tools").extend;
    var window = realwindow; // HACK

    function Random() {
        this._defineEvent("changed");
        this.random = new RandomSjcl(8);
        var random = this.random;

        function mouseCollector(e) {
            var ev = e.changedTouches ? e.changedTouches[0] : e;
            var x = ev.x || ev.clientX || ev.offsetX || 0, y = ev.y || ev.clientY || ev.offsetY || 0;
            random.addEntropy([x, y], 2, "mouse");
        }

        try {
            // get cryptographically strong entropy in Webkit
            var ab = new Uint32Array(32);
            crypto.getRandomValues(ab);
            this.random.addEntropy(ab, 1024, "crypto.getRandomValues");
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
    }

    extend(Random.prototype, eventEmitter, serializable, {
        serialize: function () { },
        deserialize: function () { },

        bitArray: function (bitLength) {
            var ba = new BitArray(this._getRandomWords(bitLength));
            if (bitLength % 32) {
                ba = ba.bitSlice(0, bitLength);
            }
            return ba;
        },
        bigInteger: function (bitLength) {
            return new BigInt(Bn.fromBits(this._getRandomWords(bitLength)));
        },
        double: function () {
            var rndInt = this._getRandomWords(32)[0] + 0x80000000;
            var double = rndInt * 2.3283064365386963e-10;
            return double;
        },

        _getRandomWords: function (bitLength) {
            // TODO ACHTUNG this is temp solution!
            if (!this.random.isReady()) {
                this.random.addEntropy(urandom.bytes(128), 1024, "fake");
                console.warn("Fortuna is seeded with fake entropy!");
            }
            var byteLength = (bitLength / 32) + (bitLength % 32 ? 1 : 0);
            var words = this.random.randomWords(byteLength);
            return words;
        }
    });

    module.exports = Random;
});