export interface SubclassOfMultivalue<T extends Multivalue> {
    new (a: any, b: any, c:any): T;
    typeName: string;
}

interface ConvertionRule {
    fn: (value: any) => any;
    r: boolean;
}

export class Multivalue {
    private static map: {
        [from: string]: {
            [to: string]: ConvertionRule
        }
    } = {};

    public static register<S extends Multivalue, D extends Multivalue>(from: SubclassOfMultivalue<S>, to: SubclassOfMultivalue<D>, fn: (from: S) => D, hasRestrictions: boolean = false): void {
        var fromType = from.typeName;
        var toType = to.typeName;
        if (!this.map.hasOwnProperty(fromType)) {
            this.map[fromType] = {};
        }
        if (this.map[fromType].hasOwnProperty(toType)) {
            console.warn("Warning! The converter from " + fromType + " to " + toType + " was overwritten");
        }
        this.map[fromType][toType] = {
            fn: fn,
            r: hasRestrictions
        };
    }

    private static canConvertDirectly(from: string, to: string): boolean {
        if (!this.map.hasOwnProperty(from)) return false;
        if (!this.map[from].hasOwnProperty(to)) return false;
        return true;
    }

    private static _getMediator(from: string, to: string, useAny: boolean = false): string {
        for (var f in this.map) {
            if (this.map.hasOwnProperty(f)) {
                if (!this.map[f].hasOwnProperty(to)) continue;
                if (!this.canConvertDirectly(from, f)) continue;
                if ((!this.map[f][to].r && !this.map[from][f].r) || useAny) {
                    return f;
                }
            }
        }
        return null;
    }

    private static getMediator(from: string, to: string): string {
        return this._getMediator(from, to) || this._getMediator(from, to, true);
    }

    public static convert(from: string, to: string, value: any): any {
        if (this.canConvertDirectly(from, to)) {
            return this.map[from][to].fn(value);
        }
        var mediator = this.getMediator(from, to);
        if (!mediator) {
            throw new Error("The converter from " + from + " to " + to + " is not registered");
        }
        return this.convert(mediator, to, this.convert(from, mediator, value));
    }

    public value: any;

    public GetType(): SubclassOfMultivalue<Multivalue> {
        return <SubclassOfMultivalue<Multivalue>>this.constructor;
    }

    public as<T extends Multivalue>(target: SubclassOfMultivalue<T>): T {
        if (!target || !(target.prototype instanceof Multivalue)) {
            throw new Error("Cannot convert to non-multivalue");
        }
        if (this.GetType().typeName === target.typeName) {
            return <T>this;
        }
        return Multivalue.convert(this.GetType().typeName, target.typeName, this);
    }

    public isEqualTo(other: any): boolean {
        if (!(other instanceof Multivalue)) {
            throw new Error("Cannot compare to non-multivalue");
        }
        var thisType = this.GetType();
        var otherType = (<Multivalue>other).GetType();
        if (thisType.typeName !== otherType.typeName) {
            throw new Error("Cannot compare " + thisType.typeName + " to " + otherType.typeName);
        }
        return true;
    }

    public serialize() {
        throw new Error("Not implemented");
    }

    public static deserialize(obj: any) {
        throw new Error("Not implemented");
    }
}
