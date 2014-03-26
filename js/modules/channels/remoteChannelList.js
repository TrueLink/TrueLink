define([
    "zepto",
    "modules/data-types/hex",
    "modules/channels/channel"
], function ($, Hex, Channel) {
    "use strict";
    // handles first-order channels that operate directly by transport
    function RemoteChannelList() {
    }

    RemoteChannelList.prototype = new Channel();

    $.extend(RemoteChannelList.prototype, {



    });

    return RemoteChannelList;
});