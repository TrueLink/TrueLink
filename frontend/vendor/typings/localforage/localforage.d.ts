// Type definitions for Mozilla's localForage
// Project: https://github.com/mozilla/localforage
// Definitions by: david pichsenmeister <https://github.com/3x14159265>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

interface ICallback<T> {
        (data: T): void
}


declare module "localforage" {
        function clear(): Promise<void>
        function         key(index: number): Promise<string>
        function         length(): Promise<number>
        function         getItem<T>(key: string, callback: ICallback<T>): void
        function         getItem<T>(key: string): Promise<T>
        function         setItem<T>(key: string, value: T, callback: ICallback<T>): void
        function         setItem<T>(key: string, value: T): Promise<T>
        function         removeItem<T>(key: string, callback: ICallback<T>): void
        function         removeItem<T>(key: string): Promise<T>
}