export interface ISerializableModule {
    serializable: any;
    SerializationPacket: any;
}

export interface IChannelsModule {
    Tlke: any;
    Tlec: any;
}

    export declare var channels: IChannelsModule;
    export declare var crypto_js : any;
    export declare var cryptography : any;
    export declare var dictionary : any;
    export declare var events : any;
    export declare var invariant : any;
    export declare var leemon : any;
    export declare var multivalue : any;
    export declare var sjcl : any;
    export declare var tools : any;
    export declare var urandom : any; 
    export declare var serialization: ISerializableModule;
