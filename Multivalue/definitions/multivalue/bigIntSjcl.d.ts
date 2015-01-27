import multivalue = require("../multivalue");
import sjcl = require("sjcl");
declare class BigIntSjcl extends multivalue.Multivalue {
    static typeName: string;
    value: sjcl.BigNumber;
    constructor(value: string);
    constructor(value: sjcl.BigNumber);
    isEqualTo(other: any): boolean;
    static deserialize(obj: any): void;
}
export = BigIntSjcl;
