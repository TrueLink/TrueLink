import multivalue = require("../multivalue");
import sjcl = require("sjcl");

class BitArray extends multivalue.Multivalue {
    public static get typeName(): string {
        return "bitArray";
    }

    public value: sjcl.BitArray;

    constructor(arr: sjcl.BitArray) {
        super();
        this.value = arr;
    }

    public bitSlice(bstart: number, bend: number) {
        return new BitArray(sjcl.bitArray.bitSlice(this.value, bstart, bend));
    }

    public bitLength() {
        return sjcl.bitArray.bitLength(this.value);
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        return sjcl.bitArray.equal(this.value, other.value);
    }

    public shiftRight(bits: number) {
        if (bits <= 0) {
            throw new Error("bits must be greater than 0");
        }
        return new BitArray(sjcl.bitArray._shiftRight(this.value, bits));
    }
}

export = BitArray;