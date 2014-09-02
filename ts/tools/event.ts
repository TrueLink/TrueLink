interface Handler {
    callback: Function;
    context: any;
}

export interface Callback<T> {
    (arg1: T): void;
}

export interface IEvent<T> {
    emit(value: T, sender: any): void;
    on(callback: Callback<T>, context?: any): void;
    off(callback: Callback<T>, context?: any): void;
}

export class Event<T> implements IEvent<T> {
    private _handlers: Handler[];
    private _context: any;

    constructor(context?: any) {
        this._handlers = [];
        this._context = context;
    }

    public emit(value: T, sender?: any): void {
        this._handlers.forEach((handler) => {
            handler.callback.call(handler.context || this._context, value, sender);
        });
    }

    public on(callback: Callback<T>, context?: any): void {
        if (arguments.length == 2) {
            for (var i = 0; i < this._handlers.length; i++) {
                var handler = this._handlers[i];
                if (handler.callback == callback && handler.context == context) return;
            }
        }
        this._handlers.push({ callback: callback, context: context });
    }

    public off(callback: Callback<T>, context?: any): void {
        var remaining: Handler[] = [];
        if (arguments.length == 2) {
            for (var i = 0; i < this._handlers.length; i++) {
                var handler = this._handlers[i];
                if (handler.callback != callback) continue;
                if (handler.context != context) continue;
                this._handlers.splice(i, 1);
                break;
            }
        } else {
            for (var i = 0; i < this._handlers.length; i++) {
                var handler = this._handlers[i];
                if (handler.callback != callback) continue;
                this._handlers.splice(i, 1);
                break;
            }
        }
    }
}
