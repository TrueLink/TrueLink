interface Window {
    app: any;
    fakeDb: any;
}

/*   interface EventEmitter {
        _defineEvent: Function;
        _checkEvent: Function;
        on: Function;
        off: Function;
        fire: Function;
        checkEventHandlers: Function;
    }
*/

declare var $ : any;

declare module "react" {
    export = $;
}
declare module "zepto" {
    export = $;
}
declare module "modules/events/eventEmitter" {
    export = $;
}

