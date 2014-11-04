import multivalue = require("../index");
import converters = require("../converters");
import BitArray = require("../multivalue/bitArray");
import Base64 = require("../multivalue/base64");
import Base64Url = require("../multivalue/base64url");
import BigIntSjcl = require("../multivalue/bigIntSjcl");
import BigIntForge = require("../multivalue/bigIntForge");
import ByteBuffer = require("../multivalue/byteBuffer");
import Bytes = require("../multivalue/bytes");
import DecBlocks = require("../multivalue/decBlocks");
import Hex = require("../multivalue/hex");
import Utf8String = require("../multivalue/utf8string");
import X32WordArray = require("../multivalue/x32wordArray");
import sjcl = require("sjcl");
import chai = require("chai");

var expect = chai.expect;

converters.register();

interface DataSet {
    [index:string]: multivalue.Multivalue;
    BitArray: BitArray;
    Base64: Base64;
    Base64Url: Base64Url;
    BigIntSjcl: BigIntSjcl;
    BigIntForge: BigIntForge;
    ByteBuffer: ByteBuffer;
    Bytes: Bytes;
    DecBlocks: DecBlocks;
    Hex: Hex;
    Utf8String: Utf8String;
    X32WordArray: X32WordArray;
}


describe('Multivalue', () => {
    var values1: DataSet = {
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

    var values2: DataSet = {
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

    var types: { [index:string]: multivalue.SubclassOfMultivalue<multivalue.Multivalue> } = {
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
    }

    describe('Convertion', function () {
        function testConvertersFor(from: string, values: DataSet) {
            function testConversion(to: string, values: DataSet) {
                it('to ' + to, function () {
                    var result: multivalue.Multivalue = values[from].as(types[to]);
                    expect(result).be.instanceof(types[to]).with.property("value")
                expect(result.isEqualTo(values[to])).true;
                });

            }

            describe('converts ' + from, function () {
                for (var name in values) {
                    testConversion(name, values);
                }
            });
        }

        describe('latin1', () => {
            for (var name in values1) {
                testConvertersFor(name, values1);
            }
        });

        describe('unicode', () => {
            for (var name in values2) {
                testConvertersFor(name, values2);
            }
        });

        it("Bug from real world #1", function () {
            expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(BitArray).bitLength()).to.equals(128);
            expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(DecBlocks).as(Hex).as(BitArray).bitLength()).to.equals(128);
        });
    });

    describe('Comparison', function () {

        function testComparatorsFor(from: string) {
            function testFailComparison(to: string) {
                it("and " + to + " should throw", function () {
                    var fromValue = values1[from];
                    var toValue = values1[to];
                    expect(function () { fromValue.isEqualTo(toValue); }).to.throw();
                });
            }

            function testSelfComparison(to: string) {
                it("and " + to + " should NOT throw", function () {
                    var fromValue = values1[from];
                    var toValue = values1[to];
                    expect(function () { fromValue.isEqualTo(toValue); }).not.to.throw();
                });
            }

            function testCompareToNumber() {
                it("and non-multivalue should throw", function () {
                    var value = values1[from]
                        expect(function () { value.isEqualTo(1); }).to.throw();
                });
            }

            describe('compares ' + from, function () {

                testCompareToNumber();

                for (var name in values1) {
                    if (name == from) {
                        testSelfComparison(name);
                    } else {
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