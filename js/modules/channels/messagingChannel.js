define(["zepto", "modules/channels/channel"], function (Channel) {
    "use strict";
    function MessagingChannel() { }

    MessagingChannel.prototype = new Channel();
    $.extend(MessagingChannel.prototype, {
        // IMessageProcessor: void processChannelMessage(MessagingChannel channel, PlainObject data)
        setMessageProcessor: function (messageProcessor) {
            invariant($.isFunction(messageProcessor.processChannelMessage), "messageProcessor is not implementing IMessageProcessor");
            this.messageProcessor = messageProcessor;
        },
        // data: plain object
        sendMessage: function (data) { throw new Error("Not implemented"); },

        _emitMessage: function (data) {
            this._check("messageProcessor");
            this.messageProcessor.processChannelMessage(this, data);
        }
    });

    return MessagingChannel;
});