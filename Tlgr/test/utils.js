"use strict";
var tools = require("modules/tools");
var extend = tools.extend;

var Tlgr = require("../Tlgr");
var Random = require("modules/cryptography/random");
var TestTransport = require("../../TestTransport");

function TlConnectionFactory() {
}

extend(TlConnectionFactory.prototype, {
    createTlgr: function() {
        return new Tlgr(this);
    },

    createRandom: function() {
        return new Random();
    }
});

var factory = new TlConnectionFactory();

function Connection() {
	this.transport = new TestTransport();
	this.tlgrs = [];
}

Connection.prototype._linkTlgrToTransport = function (tlgr) {
	var transport = this.transport;

    tlgr.on("packet", transport.sendNetworkPacket, transport);
    tlgr.on("openAddrIn", transport.openAddr, transport);
    transport.on("networkPacket", tlgr.onNetworkPacket, tlgr);	
}

Connection.prototype.createTlgr = function () {
	var tlgr = factory.createTlgr();
	this._linkTlgrToTransport(tlgr);
	this.tlgrs.push(tlgr);

	return tlgr;
}

var Actor = function (name, tlgr) {
    this.name = name;
    this.history = [];
    this.group = Object.create(null);
    this.tlgr = tlgr;
    this._linkTlgr();
};

Actor.prototype._linkTlgr = function () {
	var tlgr = this.tlgr;
	tlgr.on("message", this._handleMessage, this);
	tlgr.on("user_joined", this._handleUserJoined, this);
	tlgr.on("rekey", this._handleRekey, this);
	tlgr.on("user_left", this._handleUserLeft, this);
}

Actor.prototype._handleMessage = function (message) {
	console.log(this.name, "got message", message);
	this.history.push(message);
}
Actor.prototype._handleUserJoined = function (args) {
	console.log(this.name, "got join packet", args);
	this.group[args.name] = args;
}
Actor.prototype._handleRekey = function (message) {
	throw new Error("Not implemented");
}
Actor.prototype._handleUserLeft = function (message) {
	throw new Error("Not implemented");
}


Actor.prototype.startChat = function () {
	this.tlgr.init({
		userName: this.name
	});
}

Actor.prototype.joinChat = function (invite) {
	this.tlgr.init({
        invite: invite,
		userName: this.name
	});
}

Actor.prototype.generateInvitation = function () {
	return this.tlgr.generateInvitation();
}

Actor.prototype.sendMessage = function (text) {
    this.tlgr.sendMessage(text);
}



module.exports = {
    factory: factory,
    Connection: Connection,
    Actor: Actor
}