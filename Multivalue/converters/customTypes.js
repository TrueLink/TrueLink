var multivalue = require("../index");
var DecBlocks = require("../multivalue/decBlocks");
var Bytes = require("../multivalue/bytes");
var Base64 = require("../multivalue/base64");
var Base64Url = require("../multivalue/base64url");
var Utf8String = require("../multivalue/utf8string");
var Hex = require("../multivalue/hex");
var leemon = require("BigInt");
;
function HexToDecBlocks(source) {
    var bi = leemon.str2bigInt(source.value, 16);
    return new DecBlocks(leemon.bigInt2str(bi, 10));
}
exports.HexToDecBlocks = HexToDecBlocks;
function DecBlocksToHex(source) {
    var bi = leemon.str2bigInt(source.value, 10);
    var hex = new Hex(leemon.bigInt2str(bi, 16));
    return hex;
}
exports.DecBlocksToHex = DecBlocksToHex;
function DecBlocksToBytes(source) {
    var bi = leemon.str2bigInt(source.value, 10);
    var result = [];
    while (!leemon.isZero(bi)) {
        result.unshift(leemon.divInt_(bi, 256));
    }
    return new Bytes(result);
}
exports.DecBlocksToBytes = DecBlocksToBytes;
function BytesToDecBlocks(source) {
    var k = source.value.length;
    var bi = leemon.int2bigInt(0, k * 8, 0);
    for (var i = 0; i < k; i++) {
        var d = source.value[i];
        leemon.multInt_(bi, 256);
        leemon.addInt_(bi, d);
    }
    return new DecBlocks(leemon.bigInt2str(bi, 10));
}
exports.BytesToDecBlocks = BytesToDecBlocks;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrBase64Url = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function encode64(input, keyStr) {
    var i = 0;
    var output = "";
    do {
        var chr1 = input[i++];
        var chr2 = input[i++];
        var chr3 = input[i++];
        var enc1 = chr1 >> 2;
        var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        var enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    } while (i < input.length);
    return output;
}
function decode64(input, keyStr) {
    var output = [];
    var i = 0;
    do {
        var enc1 = keyStr.indexOf(input[i++]);
        var enc2 = keyStr.indexOf(input[i++]);
        var enc3 = keyStr.indexOf(input[i++]);
        var enc4 = keyStr.indexOf(input[i++]);
        var chr1 = (enc1 << 2) | (enc2 >> 4);
        var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        var chr3 = ((enc3 & 3) << 6) | enc4;
        output.push(chr1);
        if (enc3 != 64 && enc3 != -1) {
            output.push(chr2);
        }
        if (enc4 != 64 && enc4 != -1) {
            output.push(chr3);
        }
    } while (i < input.length);
    return output;
}
function BytesToBase64(source) {
    return new Base64(encode64(source.value, keyStrBase64));
}
exports.BytesToBase64 = BytesToBase64;
function Base64ToBytes(source) {
    return new Bytes(decode64(source.value, keyStrBase64));
}
exports.Base64ToBytes = Base64ToBytes;
function BytesToBase64Url(source) {
    return new Base64Url(encode64(source.value, keyStrBase64Url));
}
exports.BytesToBase64Url = BytesToBase64Url;
function Base64UrlToBytes(source) {
    return new Bytes(decode64(source.value, keyStrBase64Url));
}
exports.Base64UrlToBytes = Base64UrlToBytes;
function encodeUtf8(str) {
    str = str.replace(/\r\n/g, "\n");
    var utftext = [];
    for (var n = 0; n < str.length; n++) {
        var c = str.charCodeAt(n);
        if (c < 128) {
            utftext.push(c);
        }
        else if ((c > 127) && (c < 2048)) {
            utftext.push((c >> 6) | 192);
            utftext.push((c & 63) | 128);
        }
        else {
            utftext.push((c >> 12) | 224);
            utftext.push(((c >> 6) & 63) | 128);
            utftext.push((c & 63) | 128);
        }
    }
    return utftext;
}
function decodeUtf8(bytes) {
    var result = "";
    var i = 0;
    // Perform byte-order check.
    if (bytes.length >= 3) {
        if ((bytes[0] & 0xef) == 0xef && (bytes[1] & 0xbb) == 0xbb && (bytes[2] & 0xbf) == 0xbf) {
            // Hmm byte stream has a BOM at the start, we'll skip this.
            i = 3;
        }
    }
    while (i < bytes.length) {
        var c = bytes[i] & 0xff;
        if (c < 128) {
            result += String.fromCharCode(c);
            i++;
        }
        else if ((c > 191) && (c < 224)) {
            if (i + 1 >= bytes.length)
                throw "Un-expected encoding error, UTF-8 stream truncated, or incorrect";
            var c2 = bytes[i + 1] & 0xff;
            result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            if (i + 2 >= bytes.length || i + 1 >= bytes.length)
                throw "Un-expected encoding error, UTF-8 stream truncated, or incorrect";
            var c2 = bytes[i + 1] & 0xff;
            var c3 = bytes[i + 2] & 0xff;
            result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return result;
}
function BytesToUtf8String(source) {
    return new Utf8String(decodeUtf8(source.value));
}
exports.BytesToUtf8String = BytesToUtf8String;
function Utf8StringToBytes(source) {
    return new Bytes(encodeUtf8(source.value));
}
exports.Utf8StringToBytes = Utf8StringToBytes;
function register() {
    multivalue.Multivalue.register(Hex, DecBlocks, HexToDecBlocks);
    multivalue.Multivalue.register(DecBlocks, Hex, DecBlocksToHex);
    multivalue.Multivalue.register(Bytes, DecBlocks, BytesToDecBlocks);
    multivalue.Multivalue.register(DecBlocks, Bytes, DecBlocksToBytes);
    multivalue.Multivalue.register(Bytes, Base64, BytesToBase64);
    multivalue.Multivalue.register(Base64, Bytes, Base64ToBytes);
    multivalue.Multivalue.register(Bytes, Base64Url, BytesToBase64Url);
    multivalue.Multivalue.register(Base64Url, Bytes, Base64UrlToBytes);
    multivalue.Multivalue.register(Bytes, Utf8String, BytesToUtf8String, true);
    multivalue.Multivalue.register(Utf8String, Bytes, Utf8StringToBytes, true);
}
exports.register = register;
