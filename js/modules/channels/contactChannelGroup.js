define([
    "zepto",
    "modules/hashTable",
    "modules/channels/channel",
    "modules/channels/channelExtensions",
    "modules/channels/tlkeChannel",
    "modules/channels/remoteChannel",
    "modules/channels/genericChannel",
    "modules/channels/remoteChannelList"
], function ($, HashTable, Channel, extensions, TlkeChannel, RemoteChannel, GenericChannel, RemoteChannelList) {
    "use strict";

    function ContactChannelGroup() {
        this.remoteChannelList = new RemoteChannelList();
        this._setPacketSender(this.remoteChannelList, this.onRemoteChannelListSendPacket);

        this.channels = new HashTable();
        this.tlkeChannel = null;

        this._setTokenHandler(ContactChannelGroup.GenerateTlkeToken, this.onTokenGenerateTlke);
        this._setTokenHandler(ContactChannelGroup.OfferToken, this.onTokenOffer);
        this._setTokenHandler(ContactChannelGroup.AuthToken, this.onTokenAuth);
    }

    ContactChannelGroup.prototype = new Channel();

    $.extend(ContactChannelGroup.prototype, {

        ////////////////////
        //  User comms    //
        ////////////////////
        // user calls enterToken with ContactChannelGroup.GenerateTlkeToken argument
        onTokenGenerateTlke: function (token, context) {

        },
        // user calls enterToken with ContactChannelGroup.OfferToken argument
        onTokenOffer: function (token, context) {

        },
        // user calls enterToken with ContactChannelGroup.AuthToken argument
        onTokenAuth: function (token, context) {

        },
        // when received the remote token to create a new channel (using generic channel)
        onTokenCreateRemoteTlkeChannel: function (token, context) {

        },
        // transport calls processPacket. Careful to the structure: { receiver: "BEEF", data: "1FAA..." }
        processPacket: function (packet) {
            var chIdStr = packet.receiver;
            var receiver = this.channels.first(function (value) {return value.inId === chIdStr; });
            if (receiver) {
                receiver.processPacket(packet.data);
            } else {
                console.error("Could not find the receiver for packet ", packet, " Check packet.receiver property");
            }
        },
        // simply send the user message to the contact. data should be plain object
        sendMessage: function (data) {
            this._sendMessage(new ChannelGroupMessage(ChannelGroupMessage.MSG_TYPE_USER, data));
        },

        //////////////////////////////
        //  Remote channels comms   //
        //////////////////////////////
        // RemoteChannelList wants to send the token
        onRemoteChannelListSendPacket: function (channel, packet) {
            this._sendMessage(new ChannelGroupMessage(ChannelGroupMessage.MSG_TYPE_WRAPPER, packet));
        },
        // the remote channel has issued the token
        onRemoteChannelToken: function (channel, token, context) {

        },
        // onChannelMessage will call remoteChannelList.processPacket(data)

        //////////////////////////////
        //  Regular channels comms.
        //  (regular channels communicate via packetSender that uses onChannelSendPacket())
        //////////////////////////////
        // a message received from generic channel
        onChannelMessage: function (channel, data) {
            var message = ChannelGroupMessage.deserialize(data);
            if (message.type === ChannelGroupMessage.MSG_TYPE_USER) {
                this._emitUserMessage(message.data);
            } else if (message.type === ChannelGroupMessage.MSG_TYPE_WRAPPER) {
                this.remoteChannelList.processPacket(message.data);
            } else {
                console.warn("Received a strange message: ", message);
            }
        },
        // one of regular channels has issued a token
        onChannelToken: function (channel, token, context) {
            if (token instanceof TlkeChannel.TlkeChannelGeneratedToken) {
                // notify the owner that it should listen more channelIds
                this._emitPrompt(new ContactChannelGroup.ChannelAddedToken(token.inId));
            } else if (channel === this.tlkeChannel && token instanceof TlkeChannel.OfferToken) {
                // just mirror tlke offer token
                this._emitPrompt(new ContactChannelGroup.OfferToken(token.offer));
            } else if (channel === this.tlkeChannel && token instanceof TlkeChannel.AuthToken) {
                // just mirror tlke auth token
                this._emitPrompt(new ContactChannelGroup.AuthToken(token.auth));
            }
        },
        // channel sends a packet. Careful to the structure of the resulting packet: { receiver: "BEEF", data: "1FAA..." }
        onChannelSendPacket: function (channel, data) {
            var sender = this.channels.getItem(channel);
            var packet = {
                receiver: sender.outId,
                data: data
            };
            this._sendPacket(packet);
        },
        // channel notifies it has changed it's state
        onChannelNotifyDirty: function (channel) {
            this._notifyDirty();
        },


        _addRemoteChannel: function (channel, context) {
            this._setPacketSender(channel, this.onRemoteChannelToken);
            this.remoteChannelList.add(channel, context);
        },

        _addChannel: function (channel) {
            this._setPacketSender(channel, this.onChannelSendPacket);
            this._setTokenPrompter(channel, this.onChannelToken);
            this._setDirtyNotifier(channel, this.onChannelNotifyDirty);
            if (channel instanceof GenericChannel) {
                this._setMsgProcessor(channel, this.onChannelMessage);
            }
            channel.setRng(this.random);
        },

        _sendMessage: function (message, channel) {
            channel = channel || null; // || random generic channel
            if (!channel) { throw new Error("Not implemented"); }
            if (!(message instanceof ChannelGroupMessage)) {
                throw new Error("Argument exception");
            }
        }

    }, extensions);

    ContactChannelGroup.GenerateTlkeToken = function () {};
    ContactChannelGroup.OfferToken = function (offer) { this.offer = offer; };
    ContactChannelGroup.AuthToken = function (auth) { this.auth = auth; };
    ContactChannelGroup.ChannelAddedToken = function (inId) { this.inId = inId; };

    // the message type to communicate between ChannelGroups via GenericChannels
    // it can wrap a user message or the RemoteChannelList packet
    function ChannelGroupMessage(type, data) {
        if (!$.isPlainObject(data)) {
            throw new Error("Only plain-object data is supported now");
        }
        this.type = type;
        this.data = data;
    }
    ChannelGroupMessage.prototype.serialize = function () {
        var dto = {
            t: this.type,
            d: this.data
        };
        return dto;
    };
    ChannelGroupMessage.deserialize = function (dto) {
        return new ChannelGroupMessage(dto.t, dto.d);
    };

    ChannelGroupMessage.MSG_TYPE_USER = "u";
    ChannelGroupMessage.MSG_TYPE_WRAPPER = "w";

    return ContactChannelGroup;
});