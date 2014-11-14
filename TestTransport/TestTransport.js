"use strict";

var tools = require("../modules/tools");
var Dictionary = require("../modules/dictionary/dictionary");
var Multivalue = require("Multivalue").Multivalue;
var Hex = require("Multivalue/multivalue/hex");
var invariant = require("../modules/invariant");
var eventEmitter = require("../modules/events/eventEmitter");

var extend = tools.extend;


function TestTransport() {
    this._defineEvent("networkPacket");
    this.buffer = new Dictionary();
}

extend(TestTransport.prototype, eventEmitter, {


    openAddr: function (args) {
        var addr = args.addr;
        this.checkEventHandlers();
        console.log("opening addr: %s", addr.as(Hex));
        invariant(addr instanceof Multivalue, "addr must be multivalue");
        var bufItem = this.buffer.first(function (item) { return item.key.isEqualTo(addr.as(Hex)); });
        if (bufItem) {
            var buf = bufItem.value;
            bufItem.value = [];
            console.log("found %s sent packets", buf.length);
            buf.forEach(function (item) {
                this._onNetworkPacket(addr, item);
            }, this);
        }
    },
    closeAddr: function () {  },
    sendNetworkPacket: function (networkPacket) {
        invariant(networkPacket.addr instanceof Multivalue, "networkPacket.addr must be multivalue");
        invariant(networkPacket.data instanceof Multivalue, "networkPacket.data must be multivalue");
//            console.log("sending networkPacket, addr: %s, packet: %s", networkPacket.addr.as(Hex), networkPacket.data.as(Hex));

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
        console.log("%s bytes -> %s", packet.as(Hex).toString().length / 2, addr.as(Hex));
        this.fire("networkPacket", {
            addr: addr,
            data: packet
        });
    }
});

module.exports = TestTransport;
