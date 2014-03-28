define([
    "zepto",
    "modules/hashTable",
    "modules/channels/channel",
    "modules/channels/tokens",
    "modules/channels/channelExtensions",
    "modules/channels/tlkeChannel",
    "modules/channels/remoteChannel",
    "modules/channels/genericChannel",
    "modules/data-types/hex"
], function ($, HashTable, Channel, tokens, extensions, TlkeChannel, RemoteChannel, GenericChannel, Hex) {
    "use strict";

    function ContactChannelGroup() {

        // new RemoteChannel() will call this._notifyDirty but the dirtyNotifier is not yet set
        // just don't forget to set the dirtyNotifier after calling new ContactChannelGroup()
        this.setDirtyNotifier({notify: function () { }});

        this.channels = new HashTable();
        this.remoteChannels = new HashTable();
        this.tlkeChannel = null;

        // mirror of the contact's ContactChannelGroup to send tokens
        this.remoteChannelGroup = new RemoteChannel();
        this._addRemoteChannel(this.remoteChannelGroup, 0);
        this.channels.setItem(this, {ref: 0});

        this._setTokenHandler(tokens.ContactChannelGroup.GenerateTlkeToken, this.onTokenGenerateTlke);
        this._setTokenHandler(tokens.ContactChannelGroup.OfferToken, this.onTokenOffer);
        this._setTokenHandler(tokens.ContactChannelGroup.AuthToken, this.onTokenAuth);
    }

    ContactChannelGroup.prototype = new Channel();

    $.extend(ContactChannelGroup.prototype, {
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },

        ////////////////////
        //  User comms    //
        ////////////////////
        // user calls enterToken with ContactChannelGroup.GenerateTlkeToken argument
        onTokenGenerateTlke: function (token, context) {
            this.tlkeChannel = new TlkeChannel();
            this._addChannel(this.tlkeChannel);
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.GenerateToken());
        },
        // user calls enterToken with ContactChannelGroup.OfferToken argument
        onTokenOffer: function (token, context) {
            this.tlkeChannel = new TlkeChannel();
            this._addChannel(this.tlkeChannel);
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.OfferToken(token.offer));
        },
        // user calls enterToken with ContactChannelGroup.AuthToken argument
        onTokenAuth: function (token, context) {
            if (!this.tlkeChannel) {
                throw new Error("Tlke channel is not ready");
            }
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.AuthToken(token.auth));
        },
        // when received the remote token to create a new channel (using generic channel)
        onTokenCreateRemoteTlkeChannel: function (token, context) {

        },
        // transport calls processPacket. Careful to the structure: { receiver: "BEEF", data: "1FAA..." }
        processPacket: function (packet) {
            var receiverTuple = this.channels.first(function (value) {
                return value.inId && value.inId.as(Hex).isEqualTo(packet.receiver);
            });
            if (receiverTuple) {
                receiverTuple.key.processPacket(packet.data);
            } else {
                throw new Error("Could not find the receiver for packet ", packet, " Check packet.receiver property");
            }
        },

        // handled by extensions, configured by this._setTokenHandler()
        enterToken: function (token, context) {
            this._enterToken(token, context);
        },

        // simply send the user message to the contact. data should be plain object
        sendMessage: function (data) {
            this._sendMessage(new ChannelGroupMessage(ChannelGroupMessage.MSG_TYPE_USER, data));
        },

        //////////////////////////////
        //  Remote channels comms   //
        //////////////////////////////
        // RemoteChannel wants to send the token
        onRemoteChannelSendPacket: function (channel, packet) {
            var sender = this.remoteChannels.getItem(channel);
            this._sendMessage(new ChannelGroupMessage(ChannelGroupMessage.MSG_TYPE_WRAPPER, packet, sender.ref));
        },
        // the remote channel has issued the token
        onRemoteChannelToken: function (channel, token, context) {

            var remoteChannelTuple = this.remoteChannels.getItem(channel);
            var referencedChannelTuple = this.channels.first(function (value) {
                return value.ref === remoteChannelTuple.value.ref;
            });

            if (token instanceof tokens.ContactChannelGroup.GenerateTlkeToken) {
                // remote ContactChannelGroup has requested a new tlke channel creation with given reference
                var newTlke = new TlkeChannel();
                this._addChannel(newTlke);
                var remoteTlke = new RemoteChannel();
                this._addRemoteChannel(remoteTlke);
            }

            // if auth token etc
        },
        // the packet received in a wrapper message from generic channel
        onPacketForRemoteChannel: function (packet, ref) {
            var remoteChannelTuple = this.remoteChannels.first(function (value) {
                return value.ref === ref;
            });
            if (remoteChannelTuple) {
                remoteChannelTuple.key.processPacket(packet);
            } else {
                console.warn("Remote channel with ref " + ref + " not found");
            }
        },

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
                this.onPacketForRemoteChannel(message.data, message.ref);
            } else {
                console.warn("Received a strange message: ", message);
            }
        },
        // one of regular channels has issued a token
        onChannelToken: function (channel, token, context) {

            if (token instanceof tokens.TlkeChannel.TlkeChannelGeneratedToken) {
                // learn new ids
                this.onChannelNewIds(channel, token);
            } else if (token instanceof tokens.TlkeChannel.ChangeStateToken) {
                // just mirror tlke offer token
                this._emitPrompt(new tokens.ContactChannelGroup.ChangeStateToken(token.state));
            } else if (token instanceof tokens.TlkeChannel.GenericChannelGeneratedToken) {
                // create new generic channel
                this.onNewGenericChannelKeysReady(token);
            } else if (channel === this.tlkeChannel && token instanceof tokens.TlkeChannel.OfferToken) {
                // just mirror tlke offer token
                this._emitPrompt(new tokens.ContactChannelGroup.OfferToken(token.offer));
            } else if (channel === this.tlkeChannel && token instanceof tokens.TlkeChannel.AuthToken) {
                // just mirror tlke auth token
                this._emitPrompt(new tokens.ContactChannelGroup.AuthToken(token.auth));
            }
        },

        onChannelNewIds: function (channel, token) {
            var info = this.channels.getItem(channel);
            info.inId = token.inId;
            info.outId = token.outId;
            this.channels.setItem(channel, info);
            // notify the owner that it should listen more channelIds
            this._emitPrompt(new tokens.ContactChannelGroup.ChannelAddedToken(token.inId));
            this._notifyDirty();
        },
        // tlke channel has generated new keys for generic channel
        onNewGenericChannelKeysReady: function (token) {
            var newGeneric = new GenericChannel();
            this._addChannel(newGeneric);
            this.onChannelNewIds(newGeneric, token);
            newGeneric.enterToken(token);
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

        // add remote channel and bind handlers
        _addRemoteChannel: function (channel, reference) {
            this._setPacketSender(channel, this.onRemoteChannelSendPacket);
            this._setTokenPrompter(channel, this.onRemoteChannelToken);

            this.remoteChannels.setItem(channel, {ref: reference});
            this._notifyDirty();
        },

        // add regular channel and bind handlers
        _addChannel: function (channel, reference) {
            this._setPacketSender(channel, this.onChannelSendPacket);
            this._setTokenPrompter(channel, this.onChannelToken);
            this._setDirtyNotifier(channel, this.onChannelNotifyDirty);
            if (channel instanceof GenericChannel) {
                this._setMsgProcessor(channel, this.onChannelMessage);
            }
            channel.setRng(this.random);
            this.channels.setItem(channel, {
                inId: null,
                outId: null,
                ref: reference
            });
            this._notifyDirty();
        },

        _sendMessage: function (message, channel) {
            if (!channel) {
                this.channels.each(function (key, value) {
                    // channel.isActive later
                    if (key instanceof GenericChannel) {
                        channel = key;
                    }
                });
            }
            if (!channel) { throw new Error("Didn't found channel to send a message"); }
            if (!(message instanceof ChannelGroupMessage)) {
                throw new Error("Argument exception");
            }
            channel.sendMessage(message.serialize());
        },

        _emitUserMessage: function (message) {
            this._check("msgProcessor");
            this.msgProcessor.processMessage(this, message);
        }

    }, extensions);

    // the message type to communicate between ChannelGroups via GenericChannels
    // it can wrap a user message or the RemoteChannelList packet
    function ChannelGroupMessage(type, data, ref) {
        if (!$.isPlainObject(data)) {
            var msg = "Could not create ChannelGroupMessage message from " + JSON.stringify(data) + ". ";
            msg += "Only plain-object data is supported now";
            throw new Error(msg);
        }
        this.type = type;
        this.data = data;
        if (ref === 0 || ref) {
            this.ref = parseInt(ref);
        }
    }
    ChannelGroupMessage.prototype.serialize = function () {
        var dto = {
            t: this.type,
            d: this.data
        };
        if (this.ref === 0 || this.ref) {
            dto.r = this.ref;
        }
        return dto;
    };
    ChannelGroupMessage.deserialize = function (dto) {
        return new ChannelGroupMessage(dto.t, dto.d, dto.r);
    };

    ChannelGroupMessage.MSG_TYPE_USER = "u";
    ChannelGroupMessage.MSG_TYPE_WRAPPER = "w";

    return ContactChannelGroup;
});