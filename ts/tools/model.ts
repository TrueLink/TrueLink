    "use strict";

    import invariant = require("modules/invariant");
    import Event = require("./event");

    export class Model {
        private isModel: boolean = true;
        private _factory: any;
        public onChanged : Event.Event<any>;

        constructor() {
            this.onChanged = new Event.Event<any>("Model.onChanged");
        }

        getFactory () {
            return this._factory;
        }
        // use from ui:
        set (obj, newVal) {
            if (typeof obj === "string" && newVal !== undefined) {
                var key = obj;
                if (this[key] !== newVal) {
                    this[key] = newVal;
                    this._onChanged();
                }
                return;
            }
            invariant(typeof obj === "object", "obj must be key => value");
            var changed = false;
            for (var key in obj) {
                if(obj.hasOwnProperty(key) && this[key] !== obj[key]) {
                    this[key] = obj[key];
                    changed = true;
                }
            }
            if (changed) { this._onChanged(); }
        }
        _onChanged  () {
            this.onChanged.emit(this);
        }
        off (eName: string, handler, context) {
            if(eName === "changed") {
                this.onChanged.off(handler, context);
            } else {
                console.log("Model 'off' called with unknown event name");
            }
        }

        on (eName: string, handler, context) {
            if(eName === "changed") {
                this.onChanged.on(handler, context);
            } else {
                console.log("Model 'on' called with unknown event name");
            }
        }
        serializationNeeded  () {
            return !(<any>this).getMeta() || !(<any>this).getMeta().id;
        }
        setFactory  (factory) {
            this._factory = factory;
        }
        checkFactory  () {
            invariant(this._factory, "factory is not set");
        }
    };

