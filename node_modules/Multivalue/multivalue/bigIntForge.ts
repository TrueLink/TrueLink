"use strict";

import multivalue = require("../multivalue");
import forge = require("node-forge");
import tools = require("../tools");

class BigIntForge extends multivalue.Multivalue {
    public static get typeName(): string {
        return "bigIntForge";
    }

    constructor(value: string);
    constructor(value: jsbn.BigInteger);
    constructor(value: any) {
        super();
        if (tools.isString(value)) {
            this.value = new forge.jsbn.BigInteger(value, 16);
        } else {
            this.value = value;
        }
    }

    public isEqualTo(other: any) {
        if (!super.isEqualTo.call(this, other)) {
            return false;
        }
        return (this.value.compareTo(other.value) === 0);
    }

    public serialize() {
        throw new Error("Not implemented");
    }

    public static deserialize(str: any): BigIntForge {
        throw new Error("Not implemented");
    }
};

export = BigIntForge;
