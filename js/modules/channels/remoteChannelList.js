define([
    "zepto",
    "modules/data-types/hex",
    "modules/channels/tlkeChannel"
], function ($, Hex, TlkeChannel) {
    "use strict";
    // handles first-order channels that operate directly by transport
    function RemoteChannelList() {
        this.tuples = [];
        this.channelHandlers = {
            packetSender: { sendPacket: this.onChannelSendPacket.bind(this) }
        };
        this.packetSender = null;
    }

    $.extend(RemoteChannelList.prototype, {

        setPacketSender: function (iPacketSender) {
            this.packetSender = iPacketSender;
        },

        processPacket: function (chId, data) {

        },

        add: function (remote) {
            this._bindChannel(remote, generic);
            this._addTuple(remote, generic);
        },

        onChannelSendPacket: function (channel, data) {
            if (this.packetSender) {
                this.packetSender.sendPacket();
            }
        },

        _bindChannel: function (remote) {
            var handlers = this.channelHandlers;
            remote.setPacketSender(handlers.packetSender);
            this._addTuple(remote);
        },

        _addTuple: function (remote, generic) {
            this.tuples.push({
                remote: remote,
                generic: null,
                outId: null
            });
        },

        _getTupleByChannel: function (ch) {
            return this._getTupleBy(function (tuple) {
                return tuple.channel === ch;
            });
        },
        _getTupleBy: function (fn) {
            var found = this.tuples.filter(fn);
            if (found.length) {
                return found[0];
            }
            return null;
        }

    });

    return RemoteChannelList;
});