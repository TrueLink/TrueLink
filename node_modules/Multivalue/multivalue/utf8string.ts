import multivalue = require("../multivalue");

class Utf8String extends multivalue.Multivalue {
    public static get typeName(): string {
        return "utf8string";
    }

    public value: string;

    constructor(str: string) {
        super();
        this.value = str;
    }

    public concat(otherBytes: multivalue.Multivalue): Utf8String {
        return new Utf8String(this.value.concat(otherBytes.as(Utf8String).value));
    }

    public isEqualTo(other: any): boolean {
        if (!super.isEqualTo(other)) {
            return false;
        }
        return this.value === other.value;
    }

    public serialize(): any {
        return this.value;
    }

    public toString(): string {
        return this.value;
    }

    public static deserialize(str: string): Utf8String {
        return new Utf8String(str);
    }

    public static fromString(str: string): Utf8String {
        return new Utf8String(str);
    }
}

export = Utf8String;