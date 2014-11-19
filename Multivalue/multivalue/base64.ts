import multivalue = require("../multivalue");

class Base64String extends multivalue.Multivalue {
    public static get typeName(): string {
        return "base64";
    }

    public value: string;

    constructor(value: string) {
        super();
        this.value = value;
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        return this.value === other.value;
    }

    public serialize() {
        return this.value;
    }

    public static deserialize(str: string) {
        if (!str) {
            throw new Error("Cannot deserialize from empty string");
        }
        return new Base64String(str);
    }
}

export = Base64String;