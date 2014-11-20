export declare var extend: {
    <P, T, S1, Value, Result>(object: T, s1: S1, callback?: (objectValue: Value, sourceValue: Value) => Value, thisArg?: any): Result;
    <P, T, S1, S2, Value, Result>(object: T, s1: S1, s2: S2, callback?: (objectValue: Value, sourceValue: Value) => Value, thisArg?: any): Result;
    <P, T, S1, S2, S3, Value, Result>(object: T, s1: S1, s2: S2, s3: S3, callback?: (objectValue: Value, sourceValue: Value) => Value, thisArg?: any): Result;
    <P, T, S1, S2, S3, S4, Value, Result>(object: T, s1: S1, s2: S2, s3: S3, s4: S4, callback?: (objectValue: Value, sourceValue: Value) => Value, thisArg?: any): Result;
};
export declare var isFunction: (value: any) => boolean;
export declare var isArray: (value: any) => boolean;
export declare var isString: (value: any) => boolean;
export declare var isPlainObject: (value: any) => boolean;
