"use strict";
var converters = require("Multivalue/converters");
var Hex = require("Multivalue/multivalue/hex");
var ByteBuffer = require("Multivalue/multivalue/byteBuffer");
var Utf8String = require("Multivalue/multivalue/utf8string");
var EventEmitter = require("modules/events/eventEmitter");
var utils = require("tl-testing-utils");
var tools = require("modules/tools");
var extend = tools.extend;
var chai = require('chai');
var expect = chai.expect;

converters.register();

var logfunc = function() {
    var args = [this.name].concat(arguments);
    //console.log.apply(console, args);
}

describe("AES Forge Wrapper", function() {
    var AES = require("modules/cryptography/aes-forge");

    it("encrypt and dercypt", function() {
        var key = new Hex("FE568E7F453CB6EB837EBD8D1EBB647A");
        var iv = new Hex("0810366058C4DF0A543397B8FF774F7E");

        var data = new Utf8String("test test");
        var encrypted = AES.encryptCbc(data, key, iv);
        expect(AES.decryptCbc(encrypted, key, iv).as(Utf8String).isEqualTo(data)).to.be.true;
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

    var Tlgr = require("../Tlgr");

    before(function () {
        var random = utils.factory.createRandom();
        var aliceTlgr = this.aliceTlgr = new Tlgr.Algo(random);
        var bobTlgr = this.bobTlgr = new Tlgr.Algo(random);

        var aliceGJP = this.aliceTlgr.generateGroupJoinPackage();
        var bobGJP = this.bobTlgr.generateGroupJoinPackage();
        this.aliceTlgr.processGroupJoinPackage(bobGJP);
        this.bobTlgr.processGroupJoinPackage(aliceGJP);

        this.aliceTlgr.createChannel();
        var invite = this.aliceTlgr.generateInvite();
        this.bobTlgr.acceptInvite(invite);
    });

    it("should wrap private messages", function() {
        var message = new Utf8String("hi яяя");
        var packet = this.aliceTlgr.privatize(this.bobTlgr._aid, message);
        expect(this.bobTlgr.deprivatize(packet).as(Utf8String).isEqualTo(message)).to.be.true;
    });

    it("should send public messages", function() {
        var message = new Utf8String("hi яяя");
        var packet = this.aliceTlgr.encrypt(message);
        var received = this.bobTlgr.decrypt(packet);
        expect(received.message.as(Utf8String).isEqualTo(message)).to.be.true;
    });

    it("should send private messages", function() {
        var message = new Utf8String("hi яяя");
        var packet = this.aliceTlgr.privatize(this.bobTlgr._aid, message);
        var encrypted_packet = this.aliceTlgr.encrypt(packet);
        var decrypted_packet_with_sender = this.bobTlgr.decrypt(encrypted_packet);
        var decrypted_packet = decrypted_packet_with_sender.message
        expect(decrypted_packet_with_sender.sender.aid.as(Hex).isEqualTo(this.aliceTlgr._aid.as(Hex))).to.be.true;
        var received = this.bobTlgr.deprivatize(decrypted_packet);
        expect(decrypted_packet.as(ByteBuffer).isEqualTo(packet.as(ByteBuffer))).to.be.true;
        expect(received.as(Utf8String).isEqualTo(message)).to.be.true;
    });

});
