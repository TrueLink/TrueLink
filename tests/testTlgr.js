define(function(require, exports, module) {
    "use strict";
    var utils = require("converters/all");
    var Hex = require("modules/multivalue/hex");
    var EventEmitter = require("modules/events/eventEmitter");
    var extend = require("extend");
    var utils = require("./utils");

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("RSA Forge Wrapper", function() {
        var rsa = require("modules/cryptography/rsa-oaep-forge");

        it("should generate serializable keypair", function() {
            var keyPair = rsa.generateKeyPair({bits: 512});
            expect(rsa.PublicKey.deserialize(keyPair.publicKey.serialize()).isEqualTo(keyPair.publicKey)).to.be.true;
            expect(rsa.PrivateKey.deserialize(keyPair.privateKey.serialize()).isEqualTo(keyPair.privateKey)).to.be.true;
        })
    });
});