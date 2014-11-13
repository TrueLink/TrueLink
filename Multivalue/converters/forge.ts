"use strict";
import forge = require("node-forge");

import multivalue = require("../index");
import BigIntForge = require("../multivalue/bigIntForge");
import Hex = require("../multivalue/hex");
import Base64 = require("../multivalue/base64");
import Bytes = require("../multivalue/bytes");
import DecBlocks = require("../multivalue/decBlocks");
import BigIntSjcl = require("../multivalue/bigIntSjcl");
import ByteBuffer = require("../multivalue/byteBuffer");
import Utf8String = require("../multivalue/utf8string");

export function BigIntForgeToHex(source: BigIntForge): Hex {
    return new Hex(source.value.toString(16));
};

export function HexToBigIntForge(source: Hex): BigIntForge {
    return new BigIntForge(source.value);
};

export function BigIntForgeToBytes(source: BigIntForge): Bytes {
    return new Bytes(source.value.toByteArray().map( (n: number) => n & 0xFF ));
};

export function BytesToBigIntForge(source: Bytes): BigIntForge {
    return new BigIntForge(new forge.jsbn.BigInteger(source.value, 256));
};

export function DecBlocksToBigIntForge(source: DecBlocks): BigIntForge {
    return new BigIntForge(new forge.jsbn.BigInteger(source.value, 10));
};

export function BigIntForgeToDecBlocks(source: BigIntForge): DecBlocks {
    return new DecBlocks(source.value.toString(10));
};

export function BigIntForgeToBigIntSjcl(source: BigIntForge): BigIntSjcl {
    return new BigIntSjcl(source.value.toString(16));
};

export function BigIntSjclToBigIntForge(source: BigIntSjcl): BigIntForge {
    return new BigIntForge(source.value.toString().replace("0x", ""));
};

/// _______________________________________________________________________

export function ByteBufferToHex(source: ByteBuffer): Hex {
    return new Hex(forge.util.binary.hex.encode(source.value.bytes()));
};

export function HexToByteBuffer(source: Hex): ByteBuffer {
    return new ByteBuffer(forge.util.binary.hex.decode(source.value));
};

export function ByteBufferToBase64(source: ByteBuffer): Base64 {
    return new Base64(forge.util.encode64(source.value.bytes()));
};

export function Base64ToByteBuffer(source: Base64): ByteBuffer {
    return new ByteBuffer(forge.util.decode64(source.value));
};

export function ByteBufferToUtf8String(source: ByteBuffer): Utf8String {
    return new Utf8String(forge.util.decodeUtf8(source.value.bytes()));
};

export function Utf8StringToByteBuffer(source: Utf8String): ByteBuffer {
    return new ByteBuffer(forge.util.encodeUtf8(source.value));
};

export function register() {
    multivalue.Multivalue.register(BigIntForge, Hex, BigIntForgeToHex);
    multivalue.Multivalue.register(Hex, BigIntForge, HexToBigIntForge, true);
    multivalue.Multivalue.register(BigIntForge, Bytes, BigIntForgeToBytes);
    multivalue.Multivalue.register(Bytes, BigIntForge, BytesToBigIntForge, true);
    multivalue.Multivalue.register(BigIntForge, DecBlocks, BigIntForgeToDecBlocks, true);
    multivalue.Multivalue.register(DecBlocks, BigIntForge, DecBlocksToBigIntForge, true);
    multivalue.Multivalue.register(BigIntForge, BigIntSjcl, BigIntForgeToBigIntSjcl);
    multivalue.Multivalue.register(BigIntSjcl, BigIntForge, BigIntSjclToBigIntForge, true);

    multivalue.Multivalue.register(ByteBuffer, Hex, ByteBufferToHex);
    multivalue.Multivalue.register(Hex, ByteBuffer, HexToByteBuffer);
    multivalue.Multivalue.register(ByteBuffer, Base64, ByteBufferToBase64);
    multivalue.Multivalue.register(Base64, ByteBuffer, Base64ToByteBuffer);
    multivalue.Multivalue.register(ByteBuffer, Utf8String, ByteBufferToUtf8String, true);
    multivalue.Multivalue.register(Utf8String, ByteBuffer, Utf8StringToByteBuffer);
}