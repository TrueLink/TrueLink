define(["zepto"], function ($) {
    "use strict";
    app.factory("Profile", function (RepoItem) {
        function Profile(entity, root) {
            this.entity = entity;
            this.root = root;
            this.contacts = createContactsHelper(root, this);
            this.dialogs = createDialogsHelper(root, this);
            this.documents = createDocumentsHelper(root, this);
            this.channels = createChannelsHelper(root, this);
            this.messages = createMessagesHelper(root, this);

        }
        Profile.prototype = new RepoItem();
        angular.extend(Profile.prototype, {
            getUserBackground: function () {
                var bg = this.getData("bg");
                return parseInt(bg, 10) || 0;
            }
        });

        // helpers
        function createContactsHelper(root, profile) {
            return {
                getById: function (id) {
                    return root.contacts.getById(id);
                },
                getAll: function () {
                    return root.contacts.getAll(profile);
                },
                getRecent: function (count) {
                    return root.contacts.getRecent(profile, count);
                },
                add: function (contact) {
                    return root.contacts.add(profile, contact);
                },
                getUpdatedEventName: function () {
                    return root.contacts.getUpdatedEventName();
                },
                createContact: function (name) {
                    return root.contacts.createContact(name);
                },
                getByChannel: function (channel) {
                    return root.contacts.getByChannel(channel);
                }
            };
        }
        function createDialogsHelper(root, profile) {
            return {
                getById: function (id) {
                    return root.dialogs.getById(id);
                },
                getAll: function () {
                    return root.dialogs.getAll(profile);
                },
                getRecent: function (count) {
                    return root.dialogs.getRecent(profile, count);
                },
                add: function (dialog) {
                    return root.dialogs.add(profile, dialog);
                },
                getUpdatedEventName: function () {
                    return root.dialogs.getUpdatedEventName();
                },
                getForContact: function (contact) {
                    return root.dialogs.getForContact(profile, contact);
                }
            };
        }
        function createDocumentsHelper(root, profile) {
            return {
                getById: function (id) {
                    return root.documents.getById(id);
                },
                getAll: function () {
                    return root.documents.getAll(profile);
                },
                getRecent: function (count) {
                    return root.documents.getRecent(profile, count);
                },
                add: function (document) {
                    return root.documents.add(profile, document);
                },
                getUpdatedEventName: function () {
                    return root.documents.getUpdatedEventName();
                },
                createDocument: function (name) {
                    return root.documents.createDocument(name);
                }
            };
        }
        function createChannelsHelper(root, profile) {
            return {
                getAll: function () {
                    return root.channels.getAll(profile).then(function (found) {
                        return found.map(function (channel) {
                            channel.profile = profile;
                            return channel;
                        });
                    });
                },
                add: function (channel) {
                    return root.channels.add(profile, channel);
                },
                getById: function (id) {
                    return root.channels.getById(id).then(function (found) {
                        if (found) {
                            found.profile = profile;
                        }
                        return found;
                    });
                },
                getUpdatedEventName: function () {
                    return root.channels.getUpdatedEventName();
                },
                remove: function (channel) {
                    return root.channels.remove(profile, channel);
                }
            };
        }

        function createMessagesHelper(root, profile) {
            return {
                add: function (dialog, message) {
                    return root.messages.add(dialog, message);
                },
                getAll: function (dialog) {
                    return root.messages.getAll(dialog);
                }
            };
        }
        return Profile;
    });
});