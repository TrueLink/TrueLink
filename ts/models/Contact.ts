    "use strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import Model = require("tools/model");
    import Profile = require("models/Profile");
    import MessageHistory = require("models/MessageHistory");
    import serializable = require("modules/serialization/serializable");
    import uuid = require("uuid");

    export interface IInviteAccepted {
        displayName: string;
        invite : ITlgrInvitationMessage;
    }

    export class Contact extends Model.Model implements ISerializable {
        public onInviteReceived : Event.Event<ITlgrInvitationWrapper>;
        public onInviteAccepted : Event.Event<IInviteAccepted>;

        public name : string;
        public profile : Profile.Profile;
        public tlConnection : any;
        public invites : {[key:string] : ITlgrInvitationMessage };
        public tlgrFilter : any;

        constructor () {
           super(); 
            this.onInviteReceived = new Event.Event<ITlgrInvitationWrapper>();
            this.onInviteAccepted = new Event.Event<any>();
        this.name = null;
        this.profile = null;
        this.tlConnection = null;
        this.invites = {};
    }

        on (eName: string, handler : any, context : any) {
            super.on(eName, handler, context);
            if (eName === "inviteReceived") {
                this.onInviteReceived.on(handler, context);
            } else if (eName === "inviteAccepted") {
                this.onInviteAccepted.on(handler, context);
            }
        }

        init  (args) {
            invariant(args.tlConnection, "Can i haz args.tlConnection?");
            invariant(args.name, "Can i haz args.name?");
            this.tlConnection = args.tlConnection;
            this.name = args.name;
            
            this._link();
            this._onChanged();
        }

        setProfile  (profile) {
            this.profile = profile;
            window.profile = profile;
        }

        serialize  (packet, context) {
            packet.setData({name: this.name});
            packet.setLink("tlConnection", context.getPacket(this.tlConnection));
        }

        deserialize  (packet, context) {
            this.checkFactory();
            var factory = this.getFactory();
            var data = packet.getData();
            this.name = data.name;
            this.tlConnection = context.deserialize(packet.getLink("tlConnection"), factory.createTlConnection, factory);
            
            this._link();
        }

        _link  () {
            this.tlConnection.onMessage.on(this.processMessage, this);
        }

        processMessage  (message) {
            if(message.type === "tlgr-invite") {
                this._processTlgrInvite (message);
            }
        }

        _generateInviteId  () {
            return uuid();
        }

        _processTlgrInvite  (message: ITlgrInvitationMessage) {
            var invite: ITlgrInvitationWrapper = {
            id : this._generateInviteId(),
                message : message,
                contact : this,
                metadata : message.metadata
            }
            //message.contact = this;
            message.id = invite.id;
            this.invites[invite.id] = message;
            this._onChanged();
            this.onInviteReceived.emit(invite);
        }

        acceptInvite  (inviteId : string, displayName) {
            if (inviteId in this.invites) {
                this.onInviteAccepted.emit({ 
                    invite: this.invites[inviteId],
                    displayName: displayName
                });
                delete this.invites[inviteId];
                this._onChanged();
            }
        }

        rejectInvite (inviteId : string) {
            if (inviteId in this.invites) {
                delete this.invites[inviteId];
                this._onChanged();
            }
        }

        sendTlgrInvite  (message : ITlgrInvitationMessage) {
            message.type = "tlgr-invite";
            this._sendMessage(message);
        }

        _sendMessage (message : IUserMessage) {
            this.tlConnection.sendMessage(message);
        }
    };
extend(Contact.prototype, serializable);

