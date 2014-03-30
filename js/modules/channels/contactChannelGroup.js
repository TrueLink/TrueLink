define([
    "zepto",
    "modules/hashTable",
    "modules/channels/channel",
    "modules/channels/tokens",
    "modules/channels/channelExtensions",
    "modules/channels/tlkeChannel",
    "modules/channels/remoteChannel",
    "modules/channels/genericChannel",
    "modules/data-types/hex",
    "tools/urandom"
], function ($, HashTable, Channel, tokens, extensions, TlkeChannel, RemoteChannel, GenericChannel, Hex, urandom) {
    "use strict";

    function ContactChannelGroup() {

        // new RemoteChannel() will call this._notifyDirty but the dirtyNotifier is not yet set
        // just don't forget to set the dirtyNotifier after calling new ContactChannelGroup()
        this.setDirtyNotifier({notify: function () { }});

        this.channels = new HashTable();
        this.remoteChannels = new HashTable();
        this.tlkeChannel = null;
        // alice generates offer, bob accepts
        this.iAmAlice = null;

        // mirror of the contact's ContactChannelGroup to send tokens
        this.remoteChannelGroup = new RemoteChannel();
        this._addRemoteChannel(this.remoteChannelGroup, 0);
        this.channels.setItem(this, {ref: 0});

        this._setTokenHandler(tokens.ContactChannelGroup.GenerateTlkeToken, this.onTokenGenerateTlke);
        this._setTokenHandler(tokens.ContactChannelGroup.OfferToken, this.onTokenOffer);
        this._setTokenHandler(tokens.ContactChannelGroup.AuthToken, this.onTokenAuth);
        this._setTokenHandler(tokens.ContactChannelGroup.GenerateOverTlkeToken, this.requestCreateExtraGenericChannel);
    }

    ContactChannelGroup.prototype = new Channel();

    $.extend(ContactChannelGroup.prototype, {
        setMsgProcessor: function (iMsgProcessor) { this.msgProcessor = iMsgProcessor; },

        ////////////////////
        //  User comms    //
        ////////////////////
        // user calls enterToken with ContactChannelGroup.GenerateTlkeToken argument
        onTokenGenerateTlke: function (token, context) {
            this.iAmAlice = true;
            this.tlkeChannel = new TlkeChannel();
            this._addChannel(this.tlkeChannel);
            this.tlkeChannel.enterToken(new tokens.TlkeChannel.GenerateToken());
        },
        // user calls enterToken with ContactChannelGroup.OfferToken argument
        onTokenOffer: function (token, context) {
            this.iAmAlice = false;
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
        onChannelToken: function (isOverChannel, channel, token, context) {

            if (token instanceof tokens.TlkeChannel.TlkeChannelGeneratedToken) {
                // learn new ids
                this.onChannelNewIds(channel, token);
            } else if (token instanceof tokens.TlkeChannel.ChangeStateToken) {
                // just mirror tlke change state token
                if (isOverChannel) {
                    this._emitPrompt(new tokens.ContactChannelGroup.OverChannelChangeStateToken(token.state));
                } else {
                    this._emitPrompt(new tokens.ContactChannelGroup.ChangeStateToken(token.state));
                }
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

            // handle additional overChannel tokens
            if (isOverChannel) {
                this.onOverChannelToken(channel, token, context);
            }
        },

        // new channel ids learned, add to routing
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
            // todo remove tlke from lists and clear this.tlkeChannel
            var newGeneric = new GenericChannel();
            this._addChannel(newGeneric, null, true);
            this.onChannelNewIds(newGeneric, token);
            newGeneric.enterToken(token);
        },
        // channel sends a packet. Careful to the structure of the resulting packet: { receiver: "BEEF", data: "1FAA..." }
        onChannelSendPacket: function (channel, data) {
            var sender = this.channels.getItem(channel);
            if (!sender.outId) {
                throw new Error("The channel did not provide it's channel ids yet");
            }
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
            var remoteChannelInfo = this.remoteChannels.getItem(channel);
            var ref = remoteChannelInfo.ref;
            var overChannelItem = this.channels.first(function (value) {
                return value.ref === remoteChannelInfo.ref;
            });
            var refChannel = overChannelItem ? overChannelItem.key : null;

            if ((token instanceof tokens.ContactChannelGroup.OfferToken) && ref === 0) {
                // remote ContactChannelGroup has provided an offer to accept
                this.onRemoteTokenOffer(token, refChannel);
            } else if (token instanceof tokens.ContactChannelGroup.AuthToken) {
                // remote ContactChannelGroup has provided an offer to accept
                refChannel.enterToken(new tokens.TlkeChannel.AuthToken(token.auth));
            }
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

        // received the remote token to create new remote channel and accept offer
        onRemoteTokenOffer: function (token) {
            var overTlke = new TlkeChannel();
            this._addChannel(overTlke, token.ref);
            var remoteTlke = new RemoteChannel();
            this._addRemoteChannel(remoteTlke, token.ref);
            overTlke.enterToken(new tokens.TlkeChannel.OfferToken(token.offer));
        },

        //////////////////////////////
        //  OverChannels (channels that communicate via remote channels)
        //////////////////////////////
        // create additional generic channel
        requestCreateExtraGenericChannel: function () {
            var overTlkeChannel = new TlkeChannel();
            var ref = urandom.int(1, 0xffffff);
            var remoteTlke = new RemoteChannel();
            this._addChannel(overTlkeChannel, ref);
            this._addRemoteChannel(remoteTlke, ref);
            console.info((this.iAmAlice ? "Alice" : "Bob") + " created remote tlke");
            overTlkeChannel.enterToken(new tokens.TlkeChannel.GenerateToken());
        },

        // token from overChannel
        onOverChannelToken: function (channel, token, context) {
            var info = this.channels.getItem(channel);
            var ref = info.ref;
            if (token instanceof tokens.TlkeChannel.OfferToken && token.offer) {
                // overTlkeChannel has generated an offer
                // ask remote contact to create channel and accept the offer
                this.remoteChannelGroup.enterToken(new tokens.ContactChannelGroup.OfferToken(token.offer, ref));
            } else if (token instanceof tokens.TlkeChannel.AuthToken && token.auth) {
                // overTlkeChannel has generated an auth
                // ask remote channel to accept it
                var remoteChannelInfo = this.remoteChannels.first(function (value) { return value.ref === ref; });
                if (!remoteChannelInfo) {
                    throw new Error("Cannot route the token over remote channel");
                }
                remoteChannelInfo.key.enterToken(new tokens.ContactChannelGroup.AuthToken(token.auth));
            }
        },

        //////////////////////////////
        //  Sync
        //////////////////////////////
        // just add new channels if don't have ones (distinguished by inId/outId)
        //
        updateChannels: function (updateChannels) {
            if (!updateChannels) { return; }
            updateChannels.forEach(this._importChannel.bind(this, false));
        },

        getChannelInfos: function () {
            var infos = [];
            this.channels.each(function (key, value) {
                if (key instanceof GenericChannel) {
                    infos.push({
                        keyData: key.serialize(),
                        valueData: {
                            inId: value.inId,
                            outId: value.outId
                        }
                    });
                }
            });
            return infos;
        },

        _importChannel: function (canStart, channelInfo) {
            var inId = channelInfo.valueData.inId;
            var outId = channelInfo.valueData.outId;
            var found = this.channels.first(function (itemInfo) {
                return itemInfo.inId.as(Hex).isEqualTo(inId.as(Hex)) && itemInfo.outId.as(Hex).isEqualTo(outId.as(Hex));
            });
            if (!found) {
                var newChannel = GenericChannel.deserialize(channelInfo.keyData);
                this._addChannel(newChannel, null, canStart);
                this.onChannelNewIds(newChannel, {
                    inId: inId,
                    outId: outId
                });
            }
        },

        //
        createChannels: function (defaultChannel, updateChannels) {
            this._importChannel(true, defaultChannel);
            this.updateChannels(updateChannels);
            // todo create some overchannels here
            this._emitPrompt(new tokens.ContactChannelGroup.ChangeStateToken(TlkeChannel.STATE_CONNECTION_SYNCED));
        },

        getYellowChannel: function () {
            var channel = this._getChannelToStart();
            var channelInfo = this.channels.getItem(channel);
            channelInfo.canStart = false;
            this.channels.setItem(channel, channelInfo);
            return channel;
        },

        //////////////////////////////
        //  Internal
        //////////////////////////////
        // add remote channel and bind handlers
        _addRemoteChannel: function (channel, reference) {
            this._setPacketSender(channel, this.onRemoteChannelSendPacket);
            this._setTokenPrompter(channel, this.onRemoteChannelToken);

            this.remoteChannels.setItem(channel, {ref: reference});
            this._notifyDirty();
        },

        // add regular channel and bind handlers
        _addChannel: function (channel, reference, canStart) {
            var isAux = !!reference;
            this._setPacketSender(channel, this.onChannelSendPacket);
            this._setTokenPrompter(channel, this.onChannelToken.bind(this, isAux));
            this._setDirtyNotifier(channel, this.onChannelNotifyDirty);
            if (channel instanceof GenericChannel) {
                this._setMsgProcessor(channel, this.onChannelMessage);
            }
            channel.setRng(this.random);
            this.channels.setItem(channel, {
                inId: null,
                outId: null,
                ref: reference,
                canStart: canStart
            });
            this._notifyDirty();
        },

        // get one of not-started channels that i can start
        _getChannelToStart: function () {
            var channel;
            this.channels.each(function (key, value) {
                if (key instanceof GenericChannel && !value.isActive && value.canStart) {
                    channel = key;
                }
            });
            return channel;
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
            this.ref = parseInt(ref, 10);
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