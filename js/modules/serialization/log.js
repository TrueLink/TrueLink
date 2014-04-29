define(["zepto"], function ($) {
    "use strict";

    function length(packet) {
        var l = JSON.stringify(packet.getData()).length;
        return l;
    }

    function log(packet, seen) {
        seen = seen && $.isFunction(seen.indexOf) ? seen : [];
        if (seen.indexOf(packet) !== -1) {
            console.log("(circular)");
            return;
        }
        seen.push(packet);
        console.group("Data, ~%s bytes in total", length(packet));
        console.dir(packet.getData());
        console.groupEnd();
        console.group("Links");
        for (var key in packet.getLinkedPackets()) {
            console.groupCollapsed(key);
                log(packet.getLinkedPackets()[key], seen);
            console.groupEnd();
        }
        console.groupEnd();
    }

    return log;
});