define([], function () {
    "use strict";

    function length (packet) {
        var l = JSON.stringify(packet.getData()).length;
        for (var key in packet.getLinks()) {
            l += length(packet.getLinks()[key]);
        }
        return l;
    }

    function log(packet) {
        console.group("Data, ~%s bytes in total", length(packet));
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