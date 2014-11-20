import multivalue = require("../multivalue");
declare class DecBlocks extends multivalue.Multivalue {
    static typeName: string;
    private static table;
    private static generateDamm(input);
    static verifyDamm(input: string): boolean;
    value: string;
    constructor(str: string);
    isEqualTo(other: any): boolean;
    toString(): string;
    static fromString(str: string): DecBlocks;
}
export = DecBlocks;
