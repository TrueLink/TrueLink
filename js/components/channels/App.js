define(["zepto", "q", "react", "bind", "components/channels/ContactTlStatus", "components/channels/Dialog"
    ], function ($, Q, React, bind, ContactTlStatus, Dialog) {
    "use strict";

    return React.createClass({
        displayName: "App",
        mixins: [bind],

        render: function () {
            var model = this.props.model;
//            var props = this.props;
//            $.each(this.props.tlkeHandshakesInProgress, function (key, channelInfo) {
//                tlkeChannelViews[key] = ContactTlStatus({
//                    channel: channelInfo,
//                    generate: props.generate.bind(null, key),
//                    accept: props.accept.bind(null, key),
//                    acceptAuth: props.acceptAuth.bind(null, key)
//                });
//            });
//            $.each(this.props.chatChannels, function (key, channelInfo) {
//                chatChannelViews[key] = Dialog({
//                    channel: channelInfo,
//                    send: props.sendTextMessage.bind(null, key)
//                });
//            });


            return React.DOM.div({className: "row test-app"},
                React.DOM.div({className: "large-12 columns"},
                    React.DOM.hr(null),
                    React.DOM.h3(null, model.id),
                    React.DOM.div({className: "row"},
                        React.DOM.div({className: "large-4 column"}, React.DOM.h4(null, "Contacts")),
                        React.DOM.div({className: "large-4 column"}, React.DOM.h4(null, "Tl Status")),
                        React.DOM.div({className: "large-4 column"}, React.DOM.h4(null, "Dialog")))));
        }
    });
});