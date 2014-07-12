define(function(require, exports, module) {
    require("converters/all");
    var BitArray = require("modules/multivalue/bitArray");
    var Base64 = require("modules/multivalue/base64");
    var Base64Url = require("modules/multivalue/base64url");
    var BigIntSjcl = require("modules/multivalue/bigIntSjcl");
    var BigIntForge = require("modules/multivalue/bigIntForge");
    var Bytes = require("modules/multivalue/bytes");
    var DecBlocks = require("modules/multivalue/decBlocks");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var X32WordArray = require("modules/multivalue/x32wordArray");

    var values = {
        BitArray: new BitArray([1400140393, 1852252269, 1702064993, 1734680881]),
        Base64: new Base64("U3RyaW5nIG1lc3NhZ2UhMQ=="),
        Base64Url: new Base64Url("U3RyaW5nIG1lc3NhZ2UhMQ"),
        BigIntSjcl: new BigIntSjcl("0x537472696E67206D6573736167652131"),
        BigIntForge: new BigIntForge("537472696E67206D6573736167652131"),
        Bytes: new Bytes([83, 116, 114, 105, 110, 103, 32, 109, 101, 115, 115, 97, 103, 101, 33, 49]),
        DecBlocks: new DecBlocks("110930550633557961317610434596264288561"),
        Hex: new Hex("537472696E67206D6573736167652131"),
        Utf8String: new Utf8String("String message!1"), 
        X32WordArray: new X32WordArray([1400140393, 1852252269, 1702064993, 1734680881], 16),
    }
    var types = {
        BitArray: BitArray,
        Base64: Base64,
        Base64Url: Base64Url,
        BigIntSjcl: BigIntSjcl,
        BigIntForge: BigIntForge,
        Bytes: Bytes,
        DecBlocks: DecBlocks,
        Hex: Hex,
        Utf8String: Utf8String,
        X32WordArray: X32WordArray,
    }

    function second(from, to) 
    {
        it('to ' + to, function() {
            var result = values[from].as(types[to]);
            console.log(from, to, values[from], values[to], result)
            expect(result).be.instanceof(types[to]).with.property("value")
            expect(result.isEqualTo(values[to])).true;
        });

    }

    function first(from)
    {
        describe('converts ' + from, function() {
            for(var name in values)
            {
                second(from, name);
            }
        });
    }

    describe('Multivalue', function() {
        for(var name in values) 
        {
            first(name);
        }
    });

    it("Bug from real world #1", function() {
        expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(BitArray).bitLength()).to.equals(128);
        expect(new Bytes([8, 169, 157, 10, 239, 70, 62, 210, 33, 191, 147, 235, 135, 251, 83, 224]).as(DecBlocks).as(Hex).as(BitArray).bitLength()).to.equals(128);
    });

});
