define(["zepto", "modules/dictionary", "tools/invariant", "modules/data-types/hex"], function ($, Dictionary, invariant, Hex) {
    "use strict";
    function ChannelRouter() {
        this.transport = null;
        this.errorNotifier = null;
        this.channels = new Dictionary();
    }

    $.extend(ChannelRouter.prototype, {
        // send packet via transport
        // IPacketSender
        sendPacket: function (channel, packet) {
            this._checkTransport();
            var route = this.channels.item(channel);
            invariant(route, "Channel is not found in the routing table");
            var outIdStr = route.outId.as(Hex).toString();
            var dataStr = packet.as(Hex).toString();
            this.transport.sendMessage(outIdStr, dataStr);
        },
        // add channel to routing table
        // IChannelRouter
        addChannel: function (channel, inId, outId) {
            invariant($.isFunction(inId.as) && $.isFunction(outId.as), "inId and outId must be multivalues");
            this._checkTransport();
            this.channels.item(channel, {
                inId: inId,
                outId: outId
            });
            this.transport.addChannel(inId.as(Hex).toString());
        },
        removeChannel: function (channel) {
            this._checkTransport();
            var route = this.channels.item(channel);
            if (!route) { return; }
            if (route.inId) {
                this.transport.deleteChannel(route.inId.as(Hex).toString());
            }
            this.channels.remove(channel);

        },

        // remove channel from routing table
        // ITransport:
        // void sendMessage(string chId, object data)
        // void addChannel(string chId)
        // void removeChannel(string chId)
        setTransport: function (transport) {
            invariant($.isFunction(transport.sendMessage), "transport is not implementing ITransport");
            invariant($.isFunction(transport.addChannel), "transport is not implementing ITransport");
            invariant($.isFunction(transport.removeChannel), "transport is not implementing ITransport");
            this.transport = transport;
        },

        // Handle error
        // IErrorNotifier:
        // void notifyError(ChannelRouter router, Error err)
        setErrorNotifier: function (notifier) {
            invariant($.isFunction(notifier.notifyError), "notifier is not implementing IErrorNotifier");
            this.errorNotifier = notifier;
        },

        // received new packet from transport
        processPacket: function (chIdStr, dataStr) {
            var channel = null;
            try {
                var chId = Hex.fromString(chIdStr);
                var route = this.channels.first(function (item) {
                    return chId.isEqualTo(item.inId.as(Hex));
                });
                if (!route) {
                    console.warn("Packet receiver not found in the routing table");
                    return;
                }
                channel = route.key;
                var packet = Hex.fromString(dataStr);
                channel.processPacket(packet);
            } catch (ex) {
                this._checkNotifier();
                this.errorNotifier.notifyError(this, channel, ex);
            }
        },

        _checkTransport: function () {
            invariant(this.transport, "transport is not set");
        },
        _checkNotifier: function () {
            invariant(this.errorNotifier, "errorNotifier is not set");
        }
    });
});