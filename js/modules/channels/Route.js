define(["zepto", "modules/channels/EventEmitter", "tools/invariant", "modules/data-types/isMultivalue", "modules/data-types/hex"
], function ($, EventEmitter, invariant, isMultivalue, Hex) {
    "use strict";
    function Route() {
        this.addr = null;
        // from me to the listener (e.g. channel)
        this._defineEvent("packet");
        // from me to the network
        this._defineEvent("networkPacket");
    }

    Route.prototype = new EventEmitter();
    $.extend(Route.prototype, {
        processPacket: function (packet) {
            invariant(this.addr, "addr is not set. Ensure to call setAddr() before processPacket()");
            invariant(isMultivalue(packet), "packet must be multivalue");
            this.fire("networkPacket", {
                addr: this.addr.outId,
                data: packet
            });
        },
        processNetworkPacket: function (networkPacket) {
            invariant(networkPacket
                && isMultivalue(networkPacket.addr)
                && isMultivalue(networkPacket.data), "networkPacket must be {addr: multivalue, data: multivalue}");
            if (this.addr && this.addr.inId.isEqualTo(networkPacket.addr.as(Hex))) {
                this.fire("packet", networkPacket.data);
            }
        },
        setAddr: function (addr) {
            invariant(addr
                && isMultivalue(addr.inId)
                && isMultivalue(addr.outId), "addr must be {inId: multivalue, outId: multivalue}");
            this.addr = {
                inId: addr.inId.as(Hex),
                outId: addr.outId.as(Hex)
            };
        }
    });

    return Route;
});