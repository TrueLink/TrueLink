import multivalue = require("../index");
import sjcl = require("sjcl");
import Hex = require("../multivalue/hex");
import Bytes = require("../multivalue/bytes");
import BitArray = require("../multivalue/bitArray");
import Base64 = require("../multivalue/base64");
import Base64Url = require("../multivalue/base64url");
import Utf8String = require("../multivalue/utf8string");
import BigIntSjcl = require("../multivalue/bigIntSjcl");
import X32WordArray = require("../multivalue/x32wordArray");

export function X32WordArrayToBitArray(source: X32WordArray): BitArray {
    return new BitArray(source.value.words);
}

export function BitArrayToX32WordArray(source: BitArray): X32WordArray {
    return new X32WordArray(source.value, sjcl.bitArray.bitLength(source.value) / 8);
}

export function Base64ToBitArray(source: Base64): BitArray {
    return new BitArray(sjcl.codec.base64.toBits(source.value));
}

export function BitArrayToBase64(source: BitArray): Base64 {
    return new Base64(sjcl.codec.base64.fromBits(source.value));
}

export function Base64UrlToBitArray(source: Base64Url): BitArray {
    return new BitArray(sjcl.codec.base64url.toBits(source.value));
}

export function BitArrayToBase64Url(source: BitArray): Base64Url {
    return new Base64Url(sjcl.codec.base64url.fromBits(source.value));
}

export function HexToBitArray(source: Hex): BitArray {
    return new BitArray(sjcl.codec.hex.toBits(source.value));
}

export function BitArrayToHex(source: BitArray): Hex {
    return new Hex(sjcl.codec.hex.fromBits(source.value));
}

export function Utf8StringToBitArray(source: Utf8String): BitArray {
    return new BitArray(sjcl.codec.utf8String.toBits(source.value));
}

export function BitArrayToUtf8String(source: BitArray): Utf8String {
    return new Utf8String(sjcl.codec.utf8String.fromBits(source.value));
}

export function BytesToBitArray(source: Bytes): BitArray {
    return new BitArray(sjcl.codec.bytes.toBits(source.value));
}

export function BitArrayToBytes(source: BitArray): Bytes {
    return new Bytes(sjcl.codec.bytes.fromBits(source.value));
}

export function BigIntSjclToBitArray(source: BigIntSjcl): BitArray {
    return new BitArray(source.value.toBits());
}

export function BitArrayToBigIntSjcl(source: BitArray): BigIntSjcl {
    return new BigIntSjcl(sjcl.bn.fromBits(source.value));
}

export function BigIntSjclToHex(source: BigIntSjcl): Hex {
    return new Hex(source.value.toString().replace("0x", ""));
}

export function HexToBigIntSjcl(source: Hex): BigIntSjcl {
    return new BigIntSjcl(new sjcl.bn(source.value));
}

function escapeRegExp(str: string) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export function Base64ToBase64Url(source: Base64): Base64Url {
    var result = replaceAll(source.value, "+", "-");
    result = replaceAll(result, "/", "_");
    result = replaceAll(result, "=", "");
    return new Base64Url(result);
}

export function Base64UrlToBase64(source: Base64Url): Base64 {
    var result = replaceAll(source.value, "-", "+");
    result = replaceAll(result, "_", "/");
    while (result.length & 3) {
        result += "=";
    }
    return new Base64(result);
}

export function register() {
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
