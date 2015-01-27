import multivalue = require("../multivalue");
import cryptojs = require("crypto-js");

function compareArrays(a: number[], b: number[]): boolean {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if ((a[i] & 0xFFFFFFFF) != (b[i] & 0xFFFFFFFF)) return false;
    }
    return true;
}

class X32WordArray extends multivalue.Multivalue {
    public static get typeName(): string {
        return "x32wordArray";
    }

    public value: cryptojs.lib.WordArray;

    constructor(value: number[], sigBytes: number);
    constructor(value: cryptojs.lib.WordArray);
    constructor(value: any, sigBytes?: number) {
        super();
        if (value instanceof Array) {
            this.value = cryptojs.lib.WordArray.create(value, sigBytes)
        } else {
            this.value = <cryptojs.lib.WordArray>value;
        }
    }

    public concat(otherBytes: multivalue.Multivalue): X32WordArray {
        return new X32WordArray(this.value.concat(otherBytes.as(X32WordArray).value));
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        if (this.value.sigBytes != other.value.sigBytes) return false;
        return compareArrays(this.value.words, other.value.words);
    }

    public static deserialize(obj: any) {
        throw new Error("not implemented");
    }
}

export = X32WordArray;