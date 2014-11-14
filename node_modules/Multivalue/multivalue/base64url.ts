import multivalue = require("../index");

class Base64StringUrl extends multivalue.Multivalue {
    public static get typeName(): string {
        return "base64url";
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
        return new Base64StringUrl(str);
    }
}

export = Base64StringUrl;