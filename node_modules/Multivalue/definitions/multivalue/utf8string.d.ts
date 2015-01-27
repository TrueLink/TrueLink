import multivalue = require("../multivalue");
declare class Utf8String extends multivalue.Multivalue {
    static typeName: string;
    value: string;
    constructor(str: string);
    concat(otherBytes: multivalue.Multivalue): Utf8String;
    isEqualTo(other: any): boolean;
    serialize(): any;
    toString(): string;
    static deserialize(str: string): Utf8String;
    static fromString(str: string): Utf8String;
}
export = Utf8String;
