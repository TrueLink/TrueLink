define(function(require, exports, module) {
    require("converters/all");
    var BitArray = require("modules/multivalue/bitArray");
    var Base64 = require("modules/multivalue/base64");
    var Base64Url = require("modules/multivalue/base64url");
    var BigIntSjcl = require("modules/multivalue/bigIntSjcl");
    var BigIntForge = require("modules/multivalue/bigIntForge");
    var ByteBuffer = require("modules/multivalue/byteBuffer");
    var Bytes = require("modules/multivalue/bytes");
    var DecBlocks = require("modules/multivalue/decBlocks");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var X32WordArray = require("modules/multivalue/x32wordArray");

    var values = {
        BitArray: new BitArray([1400140393, 1852252269, 1702064993, 1734680881, -779103857, 17591406886912]),
        Base64: new Base64("U3RyaW5nIG1lc3NhZ2UhMdGP0Y/Rjw=="),
        Base64Url: new Base64Url("U3RyaW5nIG1lc3NhZ2UhMdGP0Y_Rjw"),
        BigIntSjcl: new BigIntSjcl("0x537472696E67206D6573736167652131D18FD18FD18F"),
        BigIntForge: new BigIntForge("537472696E67206D6573736167652131D18FD18FD18F"),
        Bytes: new Bytes([83, 116, 114, 105, 110, 103, 32, 109, 101, 115, 115, 97, 103, 101, 33, 49, 209, 143, 209, 143, 209, 143]),
        DecBlocks: new DecBlocks("31224174156080973347525092013460821321037759413997967"),
        Hex: new Hex("537472696E67206D6573736167652131D18FD18FD18F"),
        ByteBuffer: new ByteBuffer("String message!1\xd1\x8f\xd1\x8f\xd1\x8f"),
        Utf8String: new Utf8String("String message!1яяя"), 
        X32WordArray: new X32WordArray([1400140393, 1852252269, 1702064993, 1734680881, -779103857, 17591406886912], 22),
    }
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
