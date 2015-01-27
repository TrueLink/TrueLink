import multivalue = require("../multivalue");
declare class Hex extends multivalue.Multivalue {
    static typeName: string;
    value: string;
    constructor(value: string);
    toString(): string;
    isEqualTo(other: any): boolean;
    serialize(): any;
    static fromString(str: string): Hex;
    static deserialize(str: string): Hex;
}
export = Hex;
