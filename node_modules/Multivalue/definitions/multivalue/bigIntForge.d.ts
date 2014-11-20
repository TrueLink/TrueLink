import multivalue = require("../multivalue");
declare class BigIntForge extends multivalue.Multivalue {
    static typeName: string;
    constructor(value: string);
    constructor(value: jsbn.BigInteger);
    isEqualTo(other: any): boolean;
    serialize(): void;
    static deserialize(str: any): BigIntForge;
}
export = BigIntForge;
