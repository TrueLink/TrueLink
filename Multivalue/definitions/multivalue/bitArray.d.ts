import multivalue = require("../multivalue");
import sjcl = require("sjcl");
declare class BitArray extends multivalue.Multivalue {
    static typeName: string;
    value: sjcl.BitArray;
    constructor(arr: sjcl.BitArray);
    bitSlice(bstart: number, bend: number): BitArray;
    bitLength(): number;
    isEqualTo(other: any): boolean;
    shiftRight(bits: number): BitArray;
}
export = BitArray;
