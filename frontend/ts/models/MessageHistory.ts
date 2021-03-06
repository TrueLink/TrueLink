"user strict";
import modules = require("modules");
    import invariant = require("invariant");
    import extend = require("../tools/extend");
    import Event = require("../tools/event");
    import Model = require("../tools/model");
    var serializable = modules.serialization.serializable;

    export class MessageHistory extends Model.Model implements ISerializable {
        private messages: Array<IUserMessage>;

        constructor () {
            super ();
            this.messages = [];
        }

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
            this.messages.push(m);
        }

        getHistory () : Array<IUserMessage> {
            return this.messages;
        }
    }
    
extend(MessageHistory.prototype, serializable);
