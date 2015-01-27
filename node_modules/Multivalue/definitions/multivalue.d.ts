export interface SubclassOfMultivalue<T extends Multivalue> {
    new (a: any, b: any, c: any): T;
    typeName: string;
}
export declare class Multivalue {
    private static map;
    static register<S extends Multivalue, D extends Multivalue>(from: SubclassOfMultivalue<S>, to: SubclassOfMultivalue<D>, fn: (from: S) => D, hasRestrictions?: boolean): void;
    private static canConvertDirectly(from, to);
    private static _getMediator(from, to, useAny?);
    private static getMediator(from, to);
    static convert(from: string, to: string, value: any): any;
    value: any;
    GetType(): SubclassOfMultivalue<Multivalue>;
    as<T extends Multivalue>(target: SubclassOfMultivalue<T>): T;
    isEqualTo(other: any): boolean;
    serialize(): void;
    static deserialize(obj: any): void;
}
