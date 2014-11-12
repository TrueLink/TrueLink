var crypto = require("crypto-js");
var multivalue = require("../index");
var X32WordArray = require("../multivalue/x32wordArray");
var Utf8String = require("../multivalue/utf8string");
var Base64 = require("../multivalue/base64");
var Hex = require("../multivalue/hex");
function Utf8StringToX32WordArray(source) {
    return new X32WordArray(crypto.enc.Utf8.parse(source.value));
}
exports.Utf8StringToX32WordArray = Utf8StringToX32WordArray;
function X32WordArrayToUtf8String(source) {
    return new Utf8String(crypto.enc.Utf8.stringify(source.value));
}
exports.X32WordArrayToUtf8String = X32WordArrayToUtf8String;
function Base64ToX32WordArray(source) {
    return new X32WordArray(crypto.enc.Base64.parse(source.value));
}
exports.Base64ToX32WordArray = Base64ToX32WordArray;
function X32WordArrayToBase64(source) {
    return new Base64(crypto.enc.Base64.stringify(source.value));
}
exports.X32WordArrayToBase64 = X32WordArrayToBase64;
function HexToX32WordArray(source) {
    return new X32WordArray(crypto.enc.Hex.parse(source.value));
}
exports.HexToX32WordArray = HexToX32WordArray;
function X32WordArrayToHex(source) {
    return new Hex(crypto.enc.Hex.stringify(source.value));
}
exports.X32WordArrayToHex = X32WordArrayToHex;
function register() {
    multivalue.Multivalue.register(Utf8String, X32WordArray, Utf8StringToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Utf8String, X32WordArrayToUtf8String, true);
    multivalue.Multivalue.register(Base64, X32WordArray, Base64ToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Base64, X32WordArrayToBase64);
    multivalue.Multivalue.register(Hex, X32WordArray, HexToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Hex, X32WordArrayToHex);
}
exports.register = register;
