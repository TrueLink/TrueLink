import forge = require("node-forge");
import multivalue = require("../multivalue");
declare class ByteBuffer extends multivalue.Multivalue {
    static typeName: string;
    value: forge.util.ByteBuffer;
    constructor(value: string);
    constructor(value: Uint8Array);
    constructor(value: forge.util.ByteBuffer);
    concat(other: multivalue.Multivalue): ByteBuffer;
    take(count: number): ByteBuffer;
    isEqualTo(other: any): boolean;
    serialize(): void;
    static deserialize(str: any): ByteBuffer;
}
export = ByteBuffer;
