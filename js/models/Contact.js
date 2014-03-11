define(["zepto"], function ($) {
    "use strict";
    app.factory("Contact", function (RepoItem, TlChannel, TlDialogChannel, $q) {
        function Contact(entity, channelRepo, dialogRepo, messageRepo) {
            this.entity = entity;
            this.channelRepo = channelRepo;
            this.tlChannel = null;
            this.dialogChannel = null;
            var that = this;
            this.dialog = {
                addMessage: function (profile, message) {
                    return dialogRepo.getForContact(profile, that).then(function (dialog) {
                        return messageRepo.add(dialog, message);
                    });
                }
            };
        }
        Contact.prototype = new RepoItem();
        angular.extend(Contact.prototype, {
            getTlChannel: function () {
                if (this.tlChannel) { return $q.when(this.tlChannel); }
                return this.channelRepo.getAllByContact(this, TlChannel.className).then(function (channels) {
                    return channels.length ? channels[0] : null;
                });
            },
            getTlDialogChannel: function () {
                if (this.dialogChannel) { return $q.when(this.dialogChannel); }
                return this.channelRepo.getAllByContact(this, TlDialogChannel.className).then(function (channels) {
                    return channels.length ? channels[0] : null;
                });
            },
            setTlChannel: function (channel) {
                this.tlChannel = channel;
                return this.channelRepo.linkChannelToContact(channel, this).then(function () {
                    return channel;
                });
            },
            setTlDialogChannel: function (channel) {
                this.dialogChannel = channel;
                var that = this;
                return this.channelRepo.linkChannelToContact(channel, this).then(function () {
                    return that.getTlChannel();
                }).then(function (tlC) {
                    that.tlChannel = null;
                    return that.channelRepo.unlinkChannelFromContact(tlC, that);
                }).then(function () {
                    return channel;
                });
            },
            abortTlChannels: function () {
                this.tlChannel = null;
                this.dialogChannel = null;
                var that = this;
                return $q.all([
                    this.getTlChannel().then(function (tlC) {
                        if (tlC) {
                            return that.channelRepo.unlinkChannelFromContact(tlC, that);
                        }
                    }),
                    this.getTlDialogChannel().then(function (tlChat) {
                        if (tlChat) {
                            return that.channelRepo.unlinkChannelFromContact(tlChat, that);
                        }
                    })
                ]);
            }
        });
        return Contact;
    });
});