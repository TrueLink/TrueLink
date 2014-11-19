import multivalue = require("../multivalue");

function compareArrays(a: number[], b: number[]): boolean {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if ((a[i] & 0xFF) != (b[i] & 0xFF)) return false;
    }
    return true;
}

class Bytes extends multivalue.Multivalue {
    public static get typeName(): string {
        return "bytes";
    }

    public value: number[];

    constructor(arr: number[]) {
        super();
        this.value = arr;
    }

    public concat(otherBytes: multivalue.Multivalue): Bytes  {
        return new Bytes(this.value.concat(otherBytes.as(Bytes).value));
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        return compareArrays(this.value, other.value);
    }

    public static deserialize(obj: any) {
        throw new Error("Not implemented");
    }
}

export = Bytes;