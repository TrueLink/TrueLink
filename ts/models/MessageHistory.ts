"user strict";
    import invariant = require("modules/invariant");
    import extend = require("tools/extend");
    import Event = require("tools/event");
    import Model = require("tools/model");
    import serializable = require("modules/serialization/serializable");

    export interface IHistoryEntry {
        date: Date;
    }

    export class MessageHistory extends Model.Model implements ISerializable {
        private messages: Array<IHistoryEntry>;

        serialize(packet, context) {
            packet.setData({
                messages : this.messages
            });
        }

        deserialize (packet, context) {
            var data = packet.getData();
            this.messages = data.messages;
        }
        
        recordMessage (m: IUserMessage) {
        }

        getHistory () : Array<IHistoryEntry> {
            return this.messages;
        }
        
    }
    
extend(MessageHistory.prototype, serializable);
