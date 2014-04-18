define(["modules/channels/EventEmitter",
    "zepto",
    "modules/data-types/isMultivalue",
    "modules/data-types/hex",
    "modules/dictionary",
    "tools/invariant"
], function (EventEmitter, $, isMultivalue, Hex, Dictionary, invariant) {
    "use strict";
    function TestTransport() {
        this._defineEvent("networkPacket");
        this.buffer = new Dictionary();
    }

    TestTransport.prototype = new EventEmitter();
    $.extend(TestTransport.prototype, {


        openAddr: function (addr) {
            this.checkEventHandlers();
            invariant(isMultivalue(addr), "addr must be multivalue");
            //this.buffer._items[2].key.isEqualTo(addr.as(Hex))
            var bufItem = this.buffer.first(function (item) { return item.key.isEqualTo(addr.as(Hex)); });
            var that = this;
            if (bufItem) {
                bufItem.value.forEach(function (item) {
                    that._onNetworkPacket(addr, item);
                });
            }
        },
        sendNetworkPacket: function (networkPacket) {
            invariant(isMultivalue(networkPacket.addr), "networkPacket.addr must be multivalue");
            invariant(isMultivalue(networkPacket.data), "networkPacket.data must be multivalue");

            var addr = networkPacket.addr;
            var packet = networkPacket.data;
            var bufItem = this.buffer.first(function (item) { return item.key.isEqualTo(addr.as(Hex)); });
            var buf;
            if (!bufItem) {
                buf = [];
                this.buffer.item(addr, buf);
            } else {
                buf = bufItem.value;
            }
            buf.push(packet);
            this._onNetworkPacket(addr, packet);
        },
        _onNetworkPacket: function (addr, packet) {
            this.fire("networkPacket", {
                addr: addr,
                data: packet
            });
        }
    });
    return TestTransport;
});