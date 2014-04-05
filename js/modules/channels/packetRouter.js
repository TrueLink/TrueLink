define(["zepto", "modules/dictionary", "tools/invariant", "modules/data-types/hex"], function ($, Dictionary, invariant, Hex) {
    "use strict";
    function PacketRouter() { // : IPacketSender, IPacketRouter
        this.routes = new Dictionary();
        this.transport = null;
    }

    PacketRouter.prototype = {
        setTransport: function (transport) {
            invariant(transport
                && $.isFunction(transport.addChannel)
                && $.isFunction(transport.deleteChannel)
                && $.isFunction(transport.addChannel), "transport is not implementing ITransport");
            this.transport = transport;
        },

        // IPacketRouter
        // (IPacketProcessor packetReceiver, Channel channel, multivalue inId, multivalue outId)
        addRoute: function (packetReceiver, channel, inId, outId) {
            invariant(packetReceiver && $.isFunction(packetReceiver.processPacket), "packetReceiver is not implementing IPacketProcessor");
            invariant(channel, "channel can not be empty");
            invariant(inId && $.isFunction(inId.as), "inId must be multivalue");
            invariant(outId && $.isFunction(outId.as), "inId must be multivalue");
            this._checkTransport();
            this.routes.item(channel, {
                inId: inId.as(Hex),
                outId: outId.as(Hex),
                receiver: packetReceiver
            });
            this.transport.addChannel(inId.as(Hex).toString());
        },
        // IPacketRouter
        removeRoute: function () {
            throw new Error("not implemented");
        },

        // IPacketSender
        sendChannelPacket: function (channel, packetData) {
            invariant(packetData && $.isFunction(packetData.as), "packetData must be multivalue");
            this._checkTransport();
            var route = this.routes.item(channel);
            if (!route) {
                console.warn("Could not found any route for the channel. Ensure addRoute() calls");
                return;
            }
            var outIdStr = route.value.outId.toString();
            var dataStr = packetData.as(Hex).toString();
            this.transport.sendMessage(outIdStr, dataStr);
        },
        // packet received from transport
        routePacket: function (chIdStr, packetStr) {
            var inId = Hex.fromString(chIdStr);
            var data = Hex.fromString(packetStr);
            var route = this.routes.first(function (item) { return inId.isEqualTo(item.value.inId); });
            if (!route) {
                console.warn("Could not found any route for the channel. Ensure addRoute() calls");
                return;
            }
            route.value.receiver.processPacket(route.key, data);
        },
        _checkTransport: function () {
            invariant(this.transport, "transport is not set");
        }
    };

    return PacketRouter;
});