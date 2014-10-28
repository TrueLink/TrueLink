/// <reference path="couch-data.d.ts"/>
interface Window {
    app: any;
    fakeDb: any;
    Notification: any;
    profile: any;
}

interface IMultivalueNetworkPacket {
    data: any;
    addr: any;
}

interface IModel{
    //isModel : any;
    set?: (obj : any, newVal : any) => any;
    _onChanged?: () => void;
    serializationNeeded?: () => any;
    setFactory?: (factory : any) => void;
    checkFactory?: () => void;
}
interface IEventEmitter {
    _defineEvent?:  (name : any) => any;
    _checkEvent?:  (name : any) => any;
    on?:  (name : any, cb : any, context : any) => any;
    off?:  (name : any, cb : any, context : any) => any;
    fire?:  (name : any, args : any) => any;
    checkEventHandlers?:  () => any;
}
interface ITlgrInvitationMessage extends IUserMessage {

    invitation : ITlgrInvitation;
}
interface ITlgrInvitationWrapper {
            id : string;
            message : ITlgrInvitationMessage;
            contact : any;
            metadata : any;
}

interface ISerializable {
    looksLikeSerializable?:  (obj : any) => any;
    serialize?:  (packet : any, context : any) => any;
    deserialize?:  (packet : any, context : any) => any;
    serializationNeeded?:  () => any;
    getMeta?:  () => any;
    exportMeta?:  (packet : any, context : any) => any;
    importMeta?:  (packet : any, context : any) => any;
}
interface IUserMessage {
    isMine?: boolean;
    time?: Date;
    unread?: boolean;
    sender?: string;
    metadata?: any;
    type?:any;
    //hacks for invitations to tlgr
    id?: string;
    contact?: any;
}
interface ITextMessage extends IUserMessage { 
    text : string;
    
}

interface ICouchTransport extends ISerializable, IEventEmitter, IModel {
    new ();
    init : (args : any) => void;
    beginPolling : (channel : any, context : any) => void;
    endPolling : (channel : any, context : any) => void;
    //_pollChannels : () => any;
    fetchChannel : (channel : any, since : any, context : any) => any;
    sendPacket : (args : any) => void;
    serialize : (packet : any, context : any) => void;
    deserialize : (packet : any, context : any) => void;
    //_setPollingUrl : (newUrl : any) => void;
    //_setPostingUrl : (newUrl : any) => void;
    //_onPollingPackets : (args : any, sender : any) => void;
    //_onPackets : (args : any) => any;
    //_onPostingSuccess : (args : any) => void;
    //_onPostingError : (errorType : any) => void;
    //_sendNextPacket : () => any;
    destroy : () => void;
}

interface ITlgrInvitation{
    pVer : any;
    inviteId : string;
    groupUid : string;
    channelId : string;
    sharedKey : string;
}

interface ITlgrGroupJoinPackage{
    ver : any;
    ht : string;
    meta : any;
    pk : string;
    aid : string;
    invite : string; //inviteID
    sign: string;
}

interface ITlgrUserData{
    //Multivalues
    aid : any;
    publicKey : any;
    meta : any;
    ht : any;
}

interface ITlgrShortUserInfo {
    aid: string;
    name: string;
    //little hack
    oldchannel?:boolean;
}

//wrapper because this is what we pass to "message" event listener,
//this is not what comes from transport
interface ITlgrTextMessageWrapper {
    sender: ITlgrShortUserInfo;
    text: string;
}

interface ITlgr extends IEventEmitter, ISerializable {
    //serializeUsers :  () => any;
    //deserializeUsers :  (byAid : any) => any;
    serialize :  (packet : any, context : any) => any;
    deserialize :  (packet : any, context : any) => any;
    getUID :  () => any;
    getUsers :  () => any;
    makePrivateMessage :  (aid : any, message : any) => any;
    sendRekeyInfo :  (aidList : any, rekeyInfo : any) => any;
    sendChannelAbandoned :  (reasonRekey?: any) => any;
    afterDeserialize :  () => any;
    getMyAid :  () => any;
    getMyName :  () => any;
    onNetworkPacket :  (networkPacket : any) => any;
    generateInvitation :  () => any;
    sendMessage :  (text : any) => any;
    init :  (args : any) => any;
}

interface IModules {
    channels : any;
    crypto_js : any;
    cryptography : any;
    dictionary : any;
    events : any;
    filter : any;
    invariant : any;
    leemon : any;
    multivalue : any;
    serialization : any;
    sjcl : any;
    tools : any;
    urandom : any;
}

declare var magic__ : IModules;
declare var __any : any;
declare var $ : any;
declare module "modules" {
    export = magic__;
}

declare module "zepto" {
    export = __any;
}
declare module "uuid" {
    export = __any;
}

declare module "react-bootstrap" {
    export = __any;
}

declare module "forge" {
    export = __any;
}

