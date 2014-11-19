var multivalue = require("../multivalue");
var sjcl = require("sjcl-all");
var Hex = require("../multivalue/hex");
var Bytes = require("../multivalue/bytes");
var BitArray = require("../multivalue/bitArray");
var Base64 = require("../multivalue/base64");
var Base64Url = require("../multivalue/base64url");
var Utf8String = require("../multivalue/utf8string");
var BigIntSjcl = require("../multivalue/bigIntSjcl");
var X32WordArray = require("../multivalue/x32wordArray");
function X32WordArrayToBitArray(source) {
    return new BitArray(source.value.words);
}
exports.X32WordArrayToBitArray = X32WordArrayToBitArray;
function BitArrayToX32WordArray(source) {
    return new X32WordArray(source.value, sjcl.bitArray.bitLength(source.value) / 8);
}
exports.BitArrayToX32WordArray = BitArrayToX32WordArray;
function Base64ToBitArray(source) {
    return new BitArray(sjcl.codec.base64.toBits(source.value));
}
exports.Base64ToBitArray = Base64ToBitArray;
function BitArrayToBase64(source) {
    return new Base64(sjcl.codec.base64.fromBits(source.value));
}
exports.BitArrayToBase64 = BitArrayToBase64;
function Base64UrlToBitArray(source) {
    return new BitArray(sjcl.codec.base64url.toBits(source.value));
}
exports.Base64UrlToBitArray = Base64UrlToBitArray;
function BitArrayToBase64Url(source) {
    return new Base64Url(sjcl.codec.base64url.fromBits(source.value));
}
exports.BitArrayToBase64Url = BitArrayToBase64Url;
function HexToBitArray(source) {
    return new BitArray(sjcl.codec.hex.toBits(source.value));
}
exports.HexToBitArray = HexToBitArray;
function BitArrayToHex(source) {
    return new Hex(sjcl.codec.hex.fromBits(source.value));
}
exports.BitArrayToHex = BitArrayToHex;
function Utf8StringToBitArray(source) {
    return new BitArray(sjcl.codec.utf8String.toBits(source.value));
}
exports.Utf8StringToBitArray = Utf8StringToBitArray;
function BitArrayToUtf8String(source) {
    return new Utf8String(sjcl.codec.utf8String.fromBits(source.value));
}
exports.BitArrayToUtf8String = BitArrayToUtf8String;
function BytesToBitArray(source) {
    return new BitArray(sjcl.codec.bytes.toBits(source.value));
}
exports.BytesToBitArray = BytesToBitArray;
function BitArrayToBytes(source) {
    return new Bytes(sjcl.codec.bytes.fromBits(source.value));
}
exports.BitArrayToBytes = BitArrayToBytes;
function BigIntSjclToBitArray(source) {
    return new BitArray(source.value.toBits());
}
exports.BigIntSjclToBitArray = BigIntSjclToBitArray;
function BitArrayToBigIntSjcl(source) {
    return new BigIntSjcl(sjcl.bn.fromBits(source.value));
}
exports.BitArrayToBigIntSjcl = BitArrayToBigIntSjcl;
function BigIntSjclToHex(source) {
    return new Hex(source.value.toString().replace("0x", ""));
}
exports.BigIntSjclToHex = BigIntSjclToHex;
function HexToBigIntSjcl(source) {
    return new BigIntSjcl(new sjcl.bn(source.value));
}
exports.HexToBigIntSjcl = HexToBigIntSjcl;
function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
function Base64ToBase64Url(source) {
    var result = replaceAll(source.value, "+", "-");
    result = replaceAll(result, "/", "_");
    result = replaceAll(result, "=", "");
    return new Base64Url(result);
}
exports.Base64ToBase64Url = Base64ToBase64Url;
function Base64UrlToBase64(source) {
    var result = replaceAll(source.value, "-", "+");
    result = replaceAll(result, "_", "/");
    while (result.length & 3) {
        result += "=";
    }
    return new Base64(result);
}
exports.Base64UrlToBase64 = Base64UrlToBase64;
function register() {
    multivalue.Multivalue.register(X32WordArray, BitArray, X32WordArrayToBitArray);
    multivalue.Multivalue.register(BitArray, X32WordArray, BitArrayToX32WordArray);
    multivalue.Multivalue.register(Base64, BitArray, Base64ToBitArray);
    multivalue.Multivalue.register(BitArray, Base64, BitArrayToBase64);
    multivalue.Multivalue.register(Base64Url, BitArray, Base64UrlToBitArray);
    multivalue.Multivalue.register(BitArray, Base64Url, BitArrayToBase64Url);
    multivalue.Multivalue.register(Hex, BitArray, HexToBitArray);
    multivalue.Multivalue.register(BitArray, Hex, BitArrayToHex);
    multivalue.Multivalue.register(Utf8String, BitArray, Utf8StringToBitArray);
    multivalue.Multivalue.register(BitArray, Utf8String, BitArrayToUtf8String, true);
    multivalue.Multivalue.register(Bytes, BitArray, BytesToBitArray);
    multivalue.Multivalue.register(BitArray, Bytes, BitArrayToBytes);
    multivalue.Multivalue.register(BigIntSjcl, BitArray, BigIntSjclToBitArray);
    multivalue.Multivalue.register(BitArray, BigIntSjcl, BitArrayToBigIntSjcl);
    multivalue.Multivalue.register(BigIntSjcl, Hex, BigIntSjclToHex);
    multivalue.Multivalue.register(Hex, BigIntSjcl, HexToBigIntSjcl);
    multivalue.Multivalue.register(Base64, Base64Url, Base64ToBase64Url);
    multivalue.Multivalue.register(Base64Url, Base64, Base64UrlToBase64);
}
exports.register = register;
