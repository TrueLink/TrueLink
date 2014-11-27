import Hex = require("../multivalue/hex");
import Bytes = require("../multivalue/bytes");
import BitArray = require("../multivalue/bitArray");
import Base64 = require("../multivalue/base64");
import Base64Url = require("../multivalue/base64url");
import Utf8String = require("../multivalue/utf8string");
import BigIntSjcl = require("../multivalue/bigIntSjcl");
import X32WordArray = require("../multivalue/x32wordArray");
export declare function X32WordArrayToBitArray(source: X32WordArray): BitArray;
export declare function BitArrayToX32WordArray(source: BitArray): X32WordArray;
export declare function Base64ToBitArray(source: Base64): BitArray;
export declare function BitArrayToBase64(source: BitArray): Base64;
export declare function Base64UrlToBitArray(source: Base64Url): BitArray;
export declare function BitArrayToBase64Url(source: BitArray): Base64Url;
export declare function HexToBitArray(source: Hex): BitArray;
export declare function BitArrayToHex(source: BitArray): Hex;
export declare function Utf8StringToBitArray(source: Utf8String): BitArray;
export declare function BitArrayToUtf8String(source: BitArray): Utf8String;
export declare function BytesToBitArray(source: Bytes): BitArray;
export declare function BitArrayToBytes(source: BitArray): Bytes;
export declare function BigIntSjclToBitArray(source: BigIntSjcl): BitArray;
export declare function BitArrayToBigIntSjcl(source: BitArray): BigIntSjcl;
export declare function BigIntSjclToHex(source: BigIntSjcl): Hex;
export declare function HexToBigIntSjcl(source: Hex): BigIntSjcl;
export declare function Base64ToBase64Url(source: Base64): Base64Url;
export declare function Base64UrlToBase64(source: Base64Url): Base64;
export declare function register(): void;