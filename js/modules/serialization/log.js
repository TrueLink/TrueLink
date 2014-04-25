define([], function () {
    "use strict";
    function log(packet) {
        console.group("Data");
            console.dir(packet.getData());
        console.groupEnd();
        console.group("Links");
            for (var key in packet.getLinks()) {
                console.groupCollapsed(key);
                    log(packet.getLinks()[key]);
                console.groupEnd();
            }
        console.groupEnd();
    }

    return log;
});