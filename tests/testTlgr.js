define(function(require, exports, module) {
    "use strict";
    var utils = require("converters/all");
    var Hex = require("modules/multivalue/hex");
    var ByteBuffer = require("modules/multivalue/byteBuffer");
    var Utf8String = require("modules/multivalue/utf8string");
    var EventEmitter = require("modules/events/eventEmitter");
    var extend = require("extend");
    var utils = require("./utils");

    var logfunc = function() {
        var args = [this.name].concat(arguments);
        //console.log.apply(console, args);
    }

    describe("AES Forge Wrapper", function() {
        var AES = require("modules/cryptography/aes-forge");

        it("encrypt and dercypt", function() {
            var key = new Hex("FE568E7F453CB6EB837EBD8D1EBB647A");
            var iv = new Hex("0810366058C4DF0A543397B8FF774F7E");

            var aes = new AES(key);
            var data = new Utf8String("test test");
            var encrypted = aes.encryptCbc(data, iv);
            expect(aes.decryptCbc(encrypted, iv).as(Utf8String).isEqualTo(data)).to.be.true
        });
    });

    describe("RSA Forge Wrapper", function() {
        var rsa = require("modules/cryptography/rsa-forge");

        it("should generate serializable keypair", function() {
            var keyPair = rsa.generateKeyPair({bits: 512});
            expect(rsa.PublicKey.deserialize(keyPair.publicKey.serialize()).isEqualTo(keyPair.publicKey)).to.be.true;
            expect(rsa.PrivateKey.deserialize(keyPair.privateKey.serialize()).isEqualTo(keyPair.privateKey)).to.be.true;
        })

        it("should decrypt encrypted", function() {
            var keyPair = rsa.generateKeyPair({bits: 512});
            var data = new Utf8String("test test");
            var encrypted = keyPair.publicKey.encrypt(data);
            expect(keyPair.privateKey.decrypt(encrypted).as(Utf8String).isEqualTo(data)).to.be.true;
        })
    });

    describe("True Link Group Rekeying", function() {
        
        it("should send private messages", function() {
            var aliceTlgr = this.aliceTlgr = utils.factory.createTlgr();
            aliceTlgr.init();
            var bobTlgr = this.bobTlgr = utils.factory.createTlgr();
            bobTlgr.init();

            var aliceGJP = this.aliceTlgr.generateGroupJoinPackage();
            var bobGJP = this.bobTlgr.generateGroupJoinPackage();
            this.aliceTlgr.processGroupJoinPackage(bobGJP);
            this.bobTlgr.processGroupJoinPackage(aliceGJP);

            this.aliceTlgr.createChannel();
            var invite = this.aliceTlgr.generateInvite();
            this.bobTlgr.acceptInvite(invite);

            var message = new Utf8String("hi");
            var packet = this.aliceTlgr.privatize(this.bobTlgr._aid, message);
            expect(this.bobTlgr.deprivatize(packet).as(Utf8String).isEqualTo(message)).to.be.true;
        });

    });

});