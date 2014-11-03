/**
 * Allows jQuery Promises to interop with non-jQuery promises
 */
interface JQueryGenericPromise<T> {
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     */
    then<U>(doneFilter: (value: T) => U, failFilter?: (reason: any) => U): JQueryGenericPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     */
    then<U>(doneFilter: (value: T) => JQueryGenericPromise<U>, failFilter?: (reason: any) => U): JQueryGenericPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     */
    then<U>(doneFilter: (value: T) => U, failFilter?: (reason: any) => JQueryGenericPromise<U>): JQueryGenericPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     */
    then<U>(doneFilter: (value: T) => JQueryGenericPromise<U>, failFilter?: (reason: any) => JQueryGenericPromise<U>): JQueryGenericPromise<U>;
}

/**
 * Interface for the JQuery promise/deferred callbacks
 */
interface JQueryPromiseCallback<T> {
    (value?: T, ...args: any[]): void;
}

interface JQueryPromiseOperator<T, R> {
	(callback: JQueryPromiseCallback<T>, ...callbacks: JQueryPromiseCallback<T>[]): JQueryPromise<R>;
	(callback: JQueryPromiseCallback<T>[], ...callbacks: JQueryPromiseCallback<T>[]): JQueryPromise<R>;
}

/**
 * Interface for the JQuery promise, part of callbacks
 */
interface JQueryPromise<T> {
    /**
     * Add handlers to be called when the Deferred object is either resolved or rejected.
     * 
     * @param alwaysCallbacks1 A function, or array of functions, that is called when the Deferred is resolved or rejected.
     * @param alwaysCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved or rejected.
     */
	always: JQueryPromiseOperator<any, T>;
    /**
     * Add handlers to be called when the Deferred object is resolved.
     * 
     * @param doneCallbacks1 A function, or array of functions, that are called when the Deferred is resolved.
     * @param doneCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved.
     */
	done: JQueryPromiseOperator<T, T>;
    /**
     * Add handlers to be called when the Deferred object is rejected.
     * 
     * @param failCallbacks1 A function, or array of functions, that are called when the Deferred is rejected.
     * @param failCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is rejected.
     */
	fail: JQueryPromiseOperator<any, T>;
    /**
     * Add handlers to be called when the Deferred object generates progress notifications.
     * 
     * @param progressCallbacks A function, or array of functions, to be called when the Deferred generates progress notifications.
     */
	progress(progressCallback: JQueryPromiseCallback<T>): JQueryPromise<T>;
	progress(progressCallbacks: JQueryPromiseCallback<T>[]): JQueryPromise<T>;

    /**
     * Determine the current state of a Deferred object.
     */
    state(): string;

    // Deprecated - given no typings
    pipe(doneFilter?: (x: any) => any, failFilter?: (x: any) => any, progressFilter?: (x: any) => any): JQueryPromise<any>;

    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (value: T) => U, failFilter?: (...reasons: any[]) => U, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (value: T) => JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => U, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (value: T) => U, failFilter?: (...reasons: any[]) => JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (value: T) => JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;

    // Because JQuery Promises Suck
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (...values: any[]) => U, failFilter?: (...reasons: any[]) => U, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (...values: any[]) => JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => U, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (...values: any[]) => U, failFilter?: (...reasons: any[]) => JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (...values: any[]) => JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
}