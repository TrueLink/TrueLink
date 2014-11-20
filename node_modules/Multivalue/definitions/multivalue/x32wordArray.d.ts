import multivalue = require("../multivalue");
import cryptojs = require("crypto-js");
declare class X32WordArray extends multivalue.Multivalue {
    static typeName: string;
    value: cryptojs.lib.WordArray;
    constructor(value: number[], sigBytes: number);
    constructor(value: cryptojs.lib.WordArray);
    concat(otherBytes: multivalue.Multivalue): X32WordArray;
    isEqualTo(other: any): boolean;
    static deserialize(obj: any): void;
}
export = X32WordArray;
