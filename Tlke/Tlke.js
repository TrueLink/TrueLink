"use strict";

var tools = require("../modules/tools");

var eventEmitter = require("../modules/events/eventEmitter");
var invariant = require("../modules/invariant");
var Multivalue = require("Multivalue").Multivalue;

var serializable = require("../modules/serialization/serializable");


var DecryptionFailedError = require('./decryption-failed-error');
var TlkeAlgo = require('./tlke-algo');

var extend = tools.extend;
var isFunction = tools.isFunction;


// tl channel that is used during key exchange (while channel is being set up)
function Tlke(factory) {
    invariant(factory, "Can be constructed only with factory");
    invariant(isFunction(factory.createRandom), "factory must have createRandom() method");

    this._defineEvent("changed");
    this._defineEvent("offer");
    this._defineEvent("auth");
    this._defineEvent("addr");
    this._defineEvent("packet");
    this._defineEvent("keyReady");

    // use the rng without serialization (assume singleton)
    this.random = factory.createRandom();

    this._algo = new TlkeAlgo(this.random);

    this.state = null;        
}

extend(Tlke.prototype, eventEmitter, serializable, {
    init: function () {
        this.state = Tlke.STATE_NOT_STARTED;
    },
    generate: function () {
        this.checkEventHandlers();
        invariant(this.state === Tlke.STATE_NOT_STARTED,
            "Can't generate offer being in a state %s", this.state);
        this._generateOffer();
    },
    enterOffer: function (offer) {
        this.checkEventHandlers();
        invariant(offer instanceof Multivalue, "offer must be multivalue");
        invariant(this.state === Tlke.STATE_NOT_STARTED,
            "Can't accept offer being in a state %s", this.state);
        invariant(offer, "Received an empty offer");
        this._acceptOffer(offer);
    },
    enterAuth: function (auth) {
        invariant(auth instanceof Multivalue, "offer must be multivalue");
        invariant(auth, "Received an empty auth");
        this._acceptAuth(auth);
    },

    processPacket: function (bytes) {
        invariant(bytes instanceof Multivalue, "bytes must be multivalue");
        switch (this.state) {
        case Tlke.STATE_AWAITING_OFFER_RESPONSE:
            this._acceptOfferResponse(bytes);
            break;
        case Tlke.STATE_AWAITING_AUTH_RESPONSE:
            this._acceptAuthResponse(bytes);
            break;
        case Tlke.STATE_AWAITING_OFFERDATA:
            this._acceptOfferData(bytes);
            break;
        case Tlke.STATE_AWAITING_AUTH:
        case Tlke.STATE_AWAITING_AUTHDATA:
            this._acceptAuthData(bytes);
            break;
        default:
            console.warn("packet ignored: not the right state");
            break;
        }
        this._onChanged();
    },



    // Alice 1.1 (instantiation)
    _generateOffer: function () {
        var ids = this._algo.generateOffer();
        // emit this event before any "packet" event call to configure the appropriate transport behavior
        this.fire("addr", ids);
        this.fire("offer", this._algo.dhAesKey);
        this.state = Tlke.STATE_AWAITING_OFFER_RESPONSE;
        this.fire("packet", this._algo.getOfferData());
        this._onChanged();
    },

    // Bob 2.1 (instantiation) offer is from getOffer (via IM)
    _acceptOffer: function (offer) {
        var ids = this._algo.acceptOffer(offer);
        this.state = Tlke.STATE_AWAITING_OFFERDATA;        
        this.fire("addr", ids);
        this._onChanged();
    },


    // Bob 2.2.
    _acceptOfferData: function (bytes) {
        try {
            this._algo.acceptOfferData(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }
        this.state = Tlke.STATE_AWAITING_AUTH;    
        this.fire("packet", this._algo.getOfferResponse());
        this.fire("auth", null);
    },

    // Alice 3.1
    _acceptOfferResponse: function (data) {
        var auth;  
        try {
            auth = this._algo.acceptOfferResponse(data);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }                     
        this.state = Tlke.STATE_AWAITING_AUTH_RESPONSE;
        this.fire("packet", this._algo.getAuthData());
        this.fire("auth", auth);
    },

    // Bob 4.2
    _acceptAuthData: function (bytes) {
        this._algo.acceptAuthData(bytes);
        if (this._algo.hasAuth()) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTH;
        }
    },

    // Bob 4.1
    _acceptAuth: function (auth) {
        this._algo.acceptAuth(auth)
        if (this._algo.hasAuthData()) {
            this._acceptAuthAndData();
        } else {
            this.state = Tlke.STATE_AWAITING_AUTHDATA;
        }
        this._onChanged();
    },

    // Bob 4.3 (4.1 + 4.2)
    _acceptAuthAndData: function () {
        var keyAndCids;
        try {
            keyAndCids = this._algo.acceptAuthAndData();
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }                     
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;
        this.fire("packet", this._algo.getAuthResponse());
        this.fire("keyReady", keyAndCids);
        this._onChanged();
    },

    // Alice 5
    _acceptAuthResponse: function (bytes) {
        var keyAndCids;
        try {
            keyAndCids = this._algo.acceptAuthResponse(bytes);
        } catch (ex) {
            if (ex instanceof DecryptionFailedError) {
                console.warn("Received bad bytes.  " + ex.innerError.message);
                return;
            } else {
                throw ex;
            }
        }   

        if (!keyAndCids) {
            this.state = Tlke.STATE_CONNECTION_FAILED;
            return;
        }
        this.state = Tlke.STATE_CONNECTION_ESTABLISHED;

        this.fire("keyReady", keyAndCids);
    },

    _onChanged: function () {
        this.fire("changed", this);
    },


    deserialize: function (packet, context) {
        var dto = packet.getData();
        this.state = dto.state;
        this._algo.deserialize(dto);
    },

    serialize: function (packet, context) {
        var data = this._algo.serialize();
        data.state = this.state;
        packet.setData(data);
        return packet;
    }

});

// A. NOT_STARTED
//    generate() -> packet + offer
//    AWAITING_OFFER_RESPONSE
//    _acceptOfferResponse() -> packet + auth
//    AWAITING_AUTH_RESPONSE
//    _acceptAuthResponse() -> keyReady | authError

// B. NOT_STARTED
//    acceptOffer(offer) -> packet
//    AWAITING_OFFERDATA
//    _acceptOfferData
//    STATE_AWAITING_AUTHDATA   |
//    _acceptAuthData           |--> packet + keyReady
//    STATE_AWAITING_AUTH       |
//    acceptAuth(auth)          |

Tlke.STATE_NOT_STARTED = 1;
Tlke.STATE_AWAITING_OFFERDATA = 2;
Tlke.STATE_AWAITING_OFFER_RESPONSE = 3;
Tlke.STATE_AWAITING_AUTH = 4;
Tlke.STATE_AWAITING_AUTHDATA = 5;
Tlke.STATE_AWAITING_AUTH_RESPONSE = 6;
Tlke.STATE_CONNECTION_ESTABLISHED = 7;
Tlke.STATE_CONNECTION_SYNCED = 8;
Tlke.STATE_CONNECTION_FAILED = -1;

module.exports = Tlke;