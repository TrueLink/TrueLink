define(function(require, exports, module) {
    require("converters/all");
    var BitArray = require("modules/multivalue/bitArray");
    var Base64 = require("modules/multivalue/base64");
    var Base64Url = require("modules/multivalue/base64url");
    var BigItnSjcl = require("modules/multivalue/bigIntSjcl");
    var Bytes = require("modules/multivalue/bytes");
    var DecBlocks = require("modules/multivalue/decBlocks");
    var Hex = require("modules/multivalue/hex");
    var Utf8String = require("modules/multivalue/utf8string");
    var X32WordArray = require("modules/multivalue/x32wordArray");
    var Bn = require("modules/sjcl/bn");

    var values = {
        BitArray: new BitArray([1777760708, -1684129233, -20238083, -704249774]),
        Base64: new Base64("afZ5xJueOi/+yzD91gYAUg=="),
        Base64Url: new Base64Url("afZ5xJueOi_-yzD91gYAUg"),
        BigItnSjcl: new BigItnSjcl(new Bn("0x69F679C49B9E3A2FFECB30FDD6060052")),
        Bytes: new Bytes([105, 246, 121, 196, 155, 158, 58, 47, 254, 203, 48, 253, 214, 6, 0, 82]),
        DecBlocks: new DecBlocks("140848714333059090483870106516841693266"),
        Hex: new Hex("69F679C49B9E3A2FFECB30FDD6060052"),
        //Utf8String: new Utf8String(""), Don't work at all
        X32WordArray: new X32WordArray([1777760708, -1684129233, -20238083, -704249774], 16),
    }
    var types = {
        BitArray: BitArray,
        Base64: Base64,
        Base64Url: Base64Url,
        BigItnSjcl: BigItnSjcl,
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
            expect(result)
                .be.instanceof(types[to])
                .with.property("value")
                .that.deep.equals(values[to].value);
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
});
