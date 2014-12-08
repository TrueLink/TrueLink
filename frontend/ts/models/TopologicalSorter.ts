"use strict";

import modules = require("modules");
var serializable = modules.serialization.serializable;
import extend = require("../tools/extend");
import invariant = require("invariant");
import event = require("../tools/event");
import uuid = require("uuid");
import model = require("../tools/model");
    
export interface IMessage<T> {
	uuid: string;
	prevIds: string[];
	data: T;
}

export interface IWithContext<T> {
	data: T;
	context: any;
}

export class Sorter<T> extends model.Model implements ISerializable {

	public onUnwrapped: event.Event<IWithContext<T>>;
	public onWrapped: event.Event<IWithContext<IMessage<T>>>;

	private _allIds: IStringSet;
	private _heads: string[];
	private _buffer: IWithContext<IMessage<T>>[];


	constructor() {
		super();

		this.onUnwrapped = new event.Event<IWithContext<T>>("TopologicalSorter.onUnwrapped");
        this.onWrapped = new event.Event<IWithContext<IMessage<T>>>("TopologicalSorter.onWrapped");
        
        this._allIds = null;
        this._heads = null;
        this._buffer = null;
	}

	private _check(): void {
		invariant(this._allIds && this._heads && this._buffer, "TopologicalSorter is not configured");
	}
 
 	public init(): void {
 		this._allIds = Object.create(null);
        this._heads = [];
        this._buffer = [];
 	}

    public serialize(packet, context): void {
        packet.setData({
            heads: this._heads,
            allIds: this._allIds,
            buffer: this._buffer
        });
    }

    public deserialize(packet, context): void {
        var data = packet.getData();

        this._heads = data.heads;
        this._allIds = data.allIds;
        this._buffer = data.buffer;
    }

    public wrap(data: T, context?: any): void {
    	this._check();

    	var message: IMessage<T> = {
    		uuid: uuid(),
    		prevIds: this._heads,
    		data: data
    	};
    	this._allIds[message.uuid] = true;
    	this._heads = [message.uuid];

    	this.onWrapped.emit({
    		data: message,
    		context: context
    	});

    	this._onChanged();
    }

    public unwrap(message: IMessage<T>, context?: any) {
    	this._check();

    	var buffer = this._buffer;

    	buffer.unshift({
    		data: message,
    		context: context
    	});

    	// check if it is time for any message to be unwrapped, one per cycle
    	var ordered: boolean;
    	do {
    		ordered = false;
    		for (var i = 0; i < buffer.length; i++) {
                if (this._doUnwrap(buffer[i])) {
                	buffer.splice(i, 1);
                    ordered = true;
                	break;
                }
            }
    	} while (ordered);

    	this._onChanged();
    }

    private _doUnwrap(messageWihtContext: IWithContext<IMessage<T>>) {
    	var heads = this._heads;
		var allIds = this._allIds;
		var message = messageWihtContext.data;

        // it is time for the message if we already know (sent or emitted) every message, previous to this 
		if (!message.prevIds.every(id => allIds[id])) { return false; }

		if (!allIds[message.uuid]) {
			// do this for unknown messages only as extra head would be added otherwise

	    	allIds[message.uuid] = true;
	    	
	    	// remove from heads every id this message covers, if some
	    	message.prevIds.forEach(id => {
	    		var index = heads.indexOf(id);
	    		if (index >= 0) {
	    			heads.splice(index, 1);
	    		}
	    	});
	    	
	    	heads.push(message.uuid);
	    }

        this.onUnwrapped.emit({
        	data: message.data,
        	context: messageWihtContext.context
        }); 
        return true;
    }
}

extend(Sorter.prototype, serializable);