define([
    "zepto",
    "modules/hashTable",
    "modules/channels/channel",
    "modules/channels/tokens",
    "modules/channels/channelExtensions",
    "modules/channels/tlkeChannel",
    "modules/channels/remoteChannel",
    "modules/channels/contactChannelGroup",
    "modules/channels/genericChannel"
], function ($, HashTable, Channel, tokens, extensions, TlkeChannel, RemoteChannel, ContactChannelGroup, GenericChannel) {
    "use strict";

    function SyncContactChannelGroup() {}

    SyncContactChannelGroup.prototype = new ContactChannelGroup();

    $.extend(SyncContactChannelGroup.prototype, {



    });

    return SyncContactChannelGroup;
});