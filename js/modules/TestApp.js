define([
    "zepto",
    "modules/channels/tokens",
    "modules/channels/contact",
    "modules/channels/tlkeChannel",
    "modules/channels/packetRouter",
    "modules/data-types/hex",
    "modules/couchTransport",
    "modules/dictionary",
    "tools/random",
    "tools/urandom"
], function ($, tokens, Contact, TlkeChannel, PacketRouter, Hex, CouchTransport, Dictionary, random, urandom) {
    "use strict";

    function App(id, isSync) {

        this.stateChanged = null;
        this.isSyncApp = isSync;

        var transport = new CouchTransport("http://couch.ctx.im:5984/tl_channels", null, id);
        this.packetRouter = new PacketRouter();
        this.packetRouter.setTransport(transport);
        transport.handler = this.packetRouter.routePacket.bind(this.packetRouter);

        // contact => {
        //   name: "John Doe"
        // }
        this.contacts = new Dictionary();

        this.channels = new Dictionary();

        this.lastContactName = null;

    }

    $.extend(App.prototype, {
        onStateChanged: function () {
            if (typeof this.stateChanged === "function") {
                this.stateChanged();
            }
        },


        startSync: function (contact) {
//            if (!(contact instanceof SyncContactChannelGroup)) {
//                throw new Error("Wrong target");
//            }

            //var message = this.getContactsData();
            //contact.sendMessage(message);
        },

        getLastContactName: function () { return this.lastContactName; },

        onContactStateChanged: function (contact) {
            this.onStateChanged();
        },

        addContact: function (name) {
            var contact = new Contact();
            this.contacts.item(contact, {
                name: name
            });
            this.onStateChanged();
        },

        addSync: function (isAccepting) {
//            var length = this.data.length(function (info) {
//                return info.key instanceof SyncContactChannelGroup;
//            });
//            var name = "sync device " + (length + 1);
//            var contact = new SyncContactChannelGroup();
//            this._addContact(name, contact);
//            if (!isAccepting) {
//                contact.enterToken(new tokens.Contact.GenerateTlkeToken());
//            }
        }

    });
    return App;

});