import multivalue = require("../multivalue");
declare class Base64String extends multivalue.Multivalue {
    static typeName: string;
    value: string;
    constructor(value: string);
    isEqualTo(other: any): boolean;
    serialize(): string;
    static deserialize(str: string): Base64String;
}
export = Base64String;
