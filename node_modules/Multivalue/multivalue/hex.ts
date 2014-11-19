import multivalue = require("../multivalue");

class Hex extends multivalue.Multivalue {
    public static get typeName(): string {
        return "hex";
    }

    public value: string;

    constructor(value: string) {
        super();
        if (value.length % 2 !== 0) {
            value = "0" + value;
        }
        this.value = value.toUpperCase();
    }

    public toString(): string {
        return this.value;
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        var thisStr = this.value.toUpperCase().replace(/^0+/, "");
        var thatStr = other.value.toUpperCase().replace(/^0+/, "");
        return thisStr === thatStr;
    }

    public serialize(): any {
        return this.value;
    }

    public static fromString(str: string): Hex {
        if (!str) {
            throw new Error("Cannot create Hex from empty string");
        }
        return new Hex(str);
    }

    public static deserialize(str: string): Hex {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Hex(str);
    }
}

export = Hex;