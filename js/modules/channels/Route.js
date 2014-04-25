define(["zepto",
    "modules/channels/EventEmitter",
    "tools/invariant",
    "modules/data-types/isMultivalue",
    "modules/data-types/hex",
    "modules/serialization/packet",
    "tools/bind"
], function ($, EventEmitter, invariant, isMultivalue, Hex, SerializationPacket, bind) {
    "use strict";
    function Route() {
        this.addr = null;
        // from me to the listener (e.g. channel)
        this._defineEvent("packet");
        // from me to the network
        this._defineEvent("networkPacket");
        this._defineEvent("addrIn");
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

        _deserialize: function (packet, context) {
            var addr = packet.getData().addr;
            if (addr) {
                this.addr = {
                    inId: Hex.deserialize(addr.inId),
                    outId: Hex.deserialize(addr.inId)
                };
            }
        },

        serialize: function (context) {
            return context.getPacket(this) || this.bind(function () {
                var packet = new SerializationPacket();
                if (this.addr) {
                    packet.setData({
                        addr: {
                            inId: this.addr.inId.as(Hex).serialize(),
                            outId: this.addr.outId.as(Hex).serialize()
                        }
                    });
                }
                context.setPacket(this, packet);
                return packet;
            })();
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
            this.fire("addrIn", this.addr.inId);
        }
    }, bind);

    Route.deserialize = function (packet, context) {
        invariant(packet, "packet is empty");
        invariant(context, "context is empty");
        return context.getObject(packet) || (function () {
            var route = new Route();
            route._deserialize(packet, context);
            context.setObject(packet, route);
            return route;
        }());
    };

    return Route;
});