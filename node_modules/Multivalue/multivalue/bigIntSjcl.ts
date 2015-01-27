import multivalue = require("../multivalue");
import sjcl = require("sjcl-all");

class BigIntSjcl extends multivalue.Multivalue {
    public static get typeName(): string {
        return "bigIntSjcl";
    }

    public value: sjcl.BigNumber;

    constructor(value: string);
    constructor(value: sjcl.BigNumber);
    constructor(value: any) {
        super();
        if (!(value instanceof sjcl.bn)) {
            value = new sjcl.bn(value);
        }
        this.value = value;
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        return this.value.equals(other.value);
    }

    public static deserialize(obj: any) {
        throw new Error("Not implemented");
    }
}

export = BigIntSjcl;