import multivalue = require("../multivalue");
declare class Bytes extends multivalue.Multivalue {
    static typeName: string;
    value: number[];
    constructor(arr: number[]);
    concat(otherBytes: multivalue.Multivalue): Bytes;
    isEqualTo(other: any): boolean;
    static deserialize(obj: any): void;
}
export = Bytes;
