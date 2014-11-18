var converters = require("../converters");
var BitArray = require("../multivalue/bitArray");
var Base64 = require("../multivalue/base64");
var Base64Url = require("../multivalue/base64url");
var BigIntSjcl = require("../multivalue/bigIntSjcl");
var BigIntForge = require("../multivalue/bigIntForge");
var ByteBuffer = require("../multivalue/byteBuffer");
var Bytes = require("../multivalue/bytes");
var DecBlocks = require("../multivalue/decBlocks");
var Hex = require("../multivalue/hex");
var Utf8String = require("../multivalue/utf8string");
var X32WordArray = require("../multivalue/x32wordArray");
var sjcl = require("sjcl-all");
var chai = require("chai");
var expect = chai.expect;
converters.register();
describe('Multivalue', function () {
    var values1 = {
        BitArray: new BitArray([1400140393, 1852252269, 1702064993, 1734680881]),
        Base64: new Base64("U3RyaW5nIG1lc3NhZ2UhMQ=="),
        Base64Url: new Base64Url("U3RyaW5nIG1lc3NhZ2UhMQ"),
        BigIntSjcl: new BigIntSjcl(new sjcl.bn("0x537472696E67206D6573736167652131")),
        BigIntForge: new BigIntForge("537472696E67206D6573736167652131"),
        ByteBuffer: new ByteBuffer("String message!1"),
        Bytes: new Bytes([83, 116, 114, 105, 110, 103, 32, 109, 101, 115, 115, 97, 103, 101, 33, 49]),
        DecBlocks: new DecBlocks("110930550633557961317610434596264288561"),
        Hex: new Hex("537472696E67206D6573736167652131"),
        Utf8String: new Utf8String("String message!1"),
        X32WordArray: new X32WordArray([1400140393, 1852252269, 1702064993, 1734680881], 16),
    };
    var values2 = {
        BitArray: new BitArray([1400140393, 1852252269, 1702064993, 1734680881, -779103857, 17591406886912]),
        Base64: new Base64("U3RyaW5nIG1lc3NhZ2UhMdGP0Y/Rjw=="),
        Base64Url: new Base64Url("U3RyaW5nIG1lc3NhZ2UhMdGP0Y_Rjw"),
        BigIntSjcl: new BigIntSjcl("0x537472696E67206D6573736167652131D18FD18FD18F"),
        BigIntForge: new BigIntForge("537472696E67206D6573736167652131D18FD18FD18F"),
        ByteBuffer: new ByteBuffer("String message!1\xd1\x8f\xd1\x8f\xd1\x8f"),
        Bytes: new Bytes([83, 116, 114, 105, 110, 103, 32, 109, 101, 115, 115, 97, 103, 101, 33, 49, 209, 143, 209, 143, 209, 143]),
        DecBlocks: new DecBlocks("31224174156080973347525092013460821321037759413997967"),
        Hex: new Hex("537472696E67206D6573736167652131D18FD18FD18F"),
        Utf8String: new Utf8String("String message!1яяя"),
        X32WordArray: new X32WordArray([1400140393, 1852252269, 1702064993, 1734680881, -779103857, 17591406886912], 22),
    };
    var types = {
        BitArray: BitArray,
        Base64: Base64,
        Base64Url: Base64Url,
        BigIntSjcl: BigIntSjcl,
        BigIntForge: BigIntForge,
        ByteBuffer: ByteBuffer,
        Bytes: Bytes,
        DecBlocks: DecBlocks,
        Hex: Hex,
        Utf8String: Utf8String,
        X32WordArray: X32WordArray,
    };
    describe('Convertion', function () {
        function testConvertersFor(from, values) {
            function testConversion(to, values) {
                it('to ' + to, function () {
                    var result = values[from].as(types[to]);
                    expect(result).be.instanceof(types[to]).with.property("value");
                    expect(result.isEqualTo(values[to])).true;
                });
            }
            describe('converts ' + from, function () {
                for (var name in values) {
                    testConversion(name, values);
                }
            });
        }
        describe('latin1', function () {
            for (var name in values1) {
                testConvertersFor(name, values1);
            }
        });
        describe('unicode', function () {
            for (var name in values2) {
                testConvertersFor(name, values2);
            }
        });
        it("Bug from real world #1", function () {
            expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(BitArray).bitLength()).to.equals(128);
            expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(DecBlocks).as(Hex).as(BitArray).bitLength()).to.equals(128);
        });
    });
    describe('Damm', function () {
        describe("Generation", function () {
            var testGeneration = function (values, expected) {
                it("should generate damm", function () {
                    expect(values.DecBlocks.toString()).equals((values.DecBlocks.value + expected).match(/.{1,4}/g).join("-"));
                });
            };
            testGeneration(values1, "2");
            testGeneration(values2, "1");
        });
        describe("Generation verification", function () {
            var testGenerationVerification = function (values) {
                it("should generate damm correctly", function () {
                    expect(DecBlocks.fromString(values.DecBlocks.toString())).to.be.not.null;
                });
            };
            testGenerationVerification(values1);
            testGenerationVerification(values2);
        });
        it("should fail verifying wrong damm input", function () {
            expect(DecBlocks.fromString("5")).to.be.null;
        });
    });
    describe('Comparison', function () {
        function testComparatorsFor(from) {
            function testFailComparison(to) {
                it("and " + to + " should throw", function () {
                    var fromValue = values1[from];
                    var toValue = values1[to];
                    expect(function () {
                        fromValue.isEqualTo(toValue);
                    }).to.throw();
                });
            }
            function testSelfComparison(to) {
                it("and " + to + " should NOT throw", function () {
                    var fromValue = values1[from];
                    var toValue = values1[to];
                    expect(function () {
                        fromValue.isEqualTo(toValue);
                    }).not.to.throw();
                });
            }
            function testCompareToNumber() {
                it("and non-multivalue should throw", function () {
                    var value = values1[from];
                    expect(function () {
                        value.isEqualTo(1);
                    }).to.throw();
                });
            }
            describe('compares ' + from, function () {
                testCompareToNumber();
                for (var name in values1) {
                    if (name == from) {
                        testSelfComparison(name);
                    }
                    else {
                        testFailComparison(name);
                    }
                }
            });
        }
        for (var name in values1) {
            testComparatorsFor(name);
        }
    });
});
