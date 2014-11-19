"use strict";
import forge = require("node-forge");
import multivalue = require("../multivalue");
import tools = require("../tools");

class ByteBuffer extends multivalue.Multivalue {
    public static get typeName(): string {
        return "byteBuffer";
    }

    public value: forge.util.ByteBuffer;

    constructor(value: string);
    constructor(value: Uint8Array);
    constructor(value: forge.util.ByteBuffer);
    constructor(value: any) {
        super();
        if(tools.isString(value) || tools.isArray(value) || forge.util.isArrayBufferView(value)) {
            this.value = new forge.util.ByteBuffer(value);
        } else {
            this.value = value.copy();
        }
    }

    public concat(other: multivalue.Multivalue): ByteBuffer {
        var result = this.value.copy();
        result.putBuffer(other.as(ByteBuffer).value.copy());
        return new ByteBuffer(result);
    }

    public take(count: number): ByteBuffer {
        if (count !== undefined) {
            count = count / 8;
        }
        return new ByteBuffer(this.value.getBytes(count));
    }
    
    public isEqualTo(other: any): boolean {
        if(!super.isEqualTo(other)) {
            return false;
        }
        return this.value.bytes() == other.value.bytes();
    }

    public serialize() {
        throw new Error("Not implemented");
    }

    public static deserialize(str: any): ByteBuffer {
        throw new Error("Not implemented");
    }
};

export = ByteBuffer;