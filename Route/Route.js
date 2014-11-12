"use strict";
var invariant = require("../modules/invariant");
var tools = require("../modules/tools");

var eventEmitter = require("../modules/events/eventEmitter");
var serializable = require("../modules/serialization/serializable");
var Hex = require("../Multivalue/multivalue/hex");
var urandom = require("../modules/urandom/urandom");


var extend = tools.extend;

var Multivalue = require("../Multivalue");

function Route(factory) {
    invariant(factory, "Can be constructed only with factory");
    this._defineEvent("changed");
    // from me to the listener (e.g. channel)
    this._defineEvent("packet");
    // from me to the network
    this._defineEvent("networkPacket");
    this._defineEvent("openAddrIn");
    this._defineEvent("closeAddrIn");

    this.factory = factory;
    this.addr = null;
    this.context = null;
}

extend(Route.prototype, eventEmitter, serializable, {
    serialize: function (packet, context) {

        packet.setData({ context: this.context });
        if (this.addr) {
            packet.setData({
                addr: {
                    inId: this.addr.inId.as(Hex).serialize(),
                    outId: this.addr.outId.as(Hex).serialize()
                }
            });
        }
    },
    deserialize: function (packet, context) {
        var data = packet.getData();

        this.context = data.context;
        if (data.addr) {
            this.addr = {
                inId: Hex.deserialize(data.addr.inId),
                outId: Hex.deserialize(data.addr.outId)
            };
        }
    },

    processPacket: function (packet) {
        invariant(this.addr, "addr is not set. Ensure to call setAddr() before processPacket()");
        invariant(packet instanceof Multivalue, "packet must be multivalue");
        this.fire("networkPacket", {
            addr: this.addr.outId,
            data: packet
        });
    },
    processNetworkPacket: function (networkPacket) {
        invariant(networkPacket
            && networkPacket.addr instanceof Multivalue
            && networkPacket.data instanceof Multivalue, "networkPacket must be {addr: multivalue, data: multivalue}");
        if (this.addr && this.addr.inId.isEqualTo(networkPacket.addr.as(Hex))) {
            this.fire("packet", networkPacket.data);
        }
    },
    setAddr: function (addr) {
        invariant(addr
            && addr.inId instanceof Multivalue
            && addr.outId instanceof Multivalue, "addr must be {inId: multivalue, outId: multivalue}");
        this.addr = {
            inId: addr.inId.as(Hex),
            outId: addr.outId.as(Hex)
        };
        this.context = urandom.int(0, 0xFFFFFFFF);
        this.fire("openAddrIn", {addr: this.addr.inId, context: this.context});
        this.fire("changed", this);
    },
    destroy: function () {
        if (this.addr) {
            this.fire("closeAddrIn", {addr: this.addr.inId, context: this.context});
        }
    }

});

module.exports = Route;