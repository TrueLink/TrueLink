"use strict";
var forge = require("node-forge");
var multivalue = require("../index");
var BigIntForge = require("../multivalue/bigIntForge");
var Hex = require("../multivalue/hex");
var Base64 = require("../multivalue/base64");
var Bytes = require("../multivalue/bytes");
var DecBlocks = require("../multivalue/decBlocks");
var BigIntSjcl = require("../multivalue/bigIntSjcl");
var ByteBuffer = require("../multivalue/byteBuffer");
var Utf8String = require("../multivalue/utf8string");
function BigIntForgeToHex(source) {
    return new Hex(source.value.toString(16));
}
exports.BigIntForgeToHex = BigIntForgeToHex;
;
function HexToBigIntForge(source) {
    return new BigIntForge(source.value);
}
exports.HexToBigIntForge = HexToBigIntForge;
;
function BigIntForgeToBytes(source) {
    return new Bytes(source.value.toByteArray().map(function (n) { return n & 0xFF; }));
}
exports.BigIntForgeToBytes = BigIntForgeToBytes;
;
function BytesToBigIntForge(source) {
    return new BigIntForge(new forge.jsbn.BigInteger(source.value, 256));
}
exports.BytesToBigIntForge = BytesToBigIntForge;
;
function DecBlocksToBigIntForge(source) {
    return new BigIntForge(new forge.jsbn.BigInteger(source.value, 10));
}
exports.DecBlocksToBigIntForge = DecBlocksToBigIntForge;
;
function BigIntForgeToDecBlocks(source) {
    return new DecBlocks(source.value.toString(10));
}
exports.BigIntForgeToDecBlocks = BigIntForgeToDecBlocks;
;
function BigIntForgeToBigIntSjcl(source) {
    return new BigIntSjcl(source.value.toString(16));
}
exports.BigIntForgeToBigIntSjcl = BigIntForgeToBigIntSjcl;
;
function BigIntSjclToBigIntForge(source) {
    return new BigIntForge(source.value.toString().replace("0x", ""));
}
exports.BigIntSjclToBigIntForge = BigIntSjclToBigIntForge;
;
/// _______________________________________________________________________
function ByteBufferToHex(source) {
    return new Hex(forge.util.binary.hex.encode(source.value.bytes()));
}
exports.ByteBufferToHex = ByteBufferToHex;
;
function HexToByteBuffer(source) {
    return new ByteBuffer(forge.util.binary.hex.decode(source.value));
}
exports.HexToByteBuffer = HexToByteBuffer;
;
function ByteBufferToBase64(source) {
    return new Base64(forge.util.encode64(source.value.bytes()));
}
exports.ByteBufferToBase64 = ByteBufferToBase64;
;
function Base64ToByteBuffer(source) {
    return new ByteBuffer(forge.util.decode64(source.value));
}
exports.Base64ToByteBuffer = Base64ToByteBuffer;
;
function ByteBufferToUtf8String(source) {
    return new Utf8String(forge.util.decodeUtf8(source.value.bytes()));
}
exports.ByteBufferToUtf8String = ByteBufferToUtf8String;
;
function Utf8StringToByteBuffer(source) {
    return new ByteBuffer(forge.util.encodeUtf8(source.value));
}
exports.Utf8StringToByteBuffer = Utf8StringToByteBuffer;
;
function register() {
    multivalue.Multivalue.register(BigIntForge, Hex, BigIntForgeToHex);
    multivalue.Multivalue.register(Hex, BigIntForge, HexToBigIntForge);
    multivalue.Multivalue.register(BigIntForge, Bytes, BigIntForgeToBytes);
    multivalue.Multivalue.register(Bytes, BigIntForge, BytesToBigIntForge);
    multivalue.Multivalue.register(BigIntForge, DecBlocks, BigIntForgeToDecBlocks);
    multivalue.Multivalue.register(DecBlocks, BigIntForge, DecBlocksToBigIntForge);
    multivalue.Multivalue.register(BigIntForge, BigIntSjcl, BigIntForgeToBigIntSjcl);
    multivalue.Multivalue.register(BigIntSjcl, BigIntForge, BigIntSjclToBigIntForge);
    multivalue.Multivalue.register(ByteBuffer, Hex, ByteBufferToHex);
    multivalue.Multivalue.register(Hex, ByteBuffer, HexToByteBuffer);
    multivalue.Multivalue.register(ByteBuffer, Base64, ByteBufferToBase64);
    multivalue.Multivalue.register(Base64, ByteBuffer, Base64ToByteBuffer);
    multivalue.Multivalue.register(ByteBuffer, Utf8String, ByteBufferToUtf8String);
    multivalue.Multivalue.register(Utf8String, ByteBuffer, Utf8StringToByteBuffer);
}
exports.register = register;
