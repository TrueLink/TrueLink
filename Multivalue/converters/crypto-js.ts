import crypto = require("crypto-js");

import multivalue = require("../multivalue");
import X32WordArray = require("../multivalue/x32wordArray");
import Utf8String = require("../multivalue/utf8string");
import Base64 = require("../multivalue/base64");
import Hex = require("../multivalue/hex");

export function Utf8StringToX32WordArray(source: Utf8String): X32WordArray {
    return new X32WordArray(crypto.enc.Utf8.parse(source.value));
}

export function X32WordArrayToUtf8String(source: X32WordArray): Utf8String {
    return new Utf8String(crypto.enc.Utf8.stringify(source.value));
}

export function Base64ToX32WordArray(source: Base64): X32WordArray {
    return new X32WordArray(crypto.enc.Base64.parse(source.value));
}

export function X32WordArrayToBase64(source: X32WordArray): Base64 {
    return new Base64(crypto.enc.Base64.stringify(source.value));
}

export function HexToX32WordArray(source: Hex): X32WordArray {
    return new X32WordArray(crypto.enc.Hex.parse(source.value));
}

export function X32WordArrayToHex(source: X32WordArray): Hex {
    return new Hex(crypto.enc.Hex.stringify(source.value));
}

export function register() {
    multivalue.Multivalue.register(Utf8String, X32WordArray, Utf8StringToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Utf8String, X32WordArrayToUtf8String, true);
    multivalue.Multivalue.register(Base64, X32WordArray, Base64ToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Base64, X32WordArrayToBase64);
    multivalue.Multivalue.register(Hex, X32WordArray, HexToX32WordArray);
    multivalue.Multivalue.register(X32WordArray, Hex, X32WordArrayToHex);
}
