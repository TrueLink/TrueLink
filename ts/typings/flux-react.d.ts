/// <reference path="couch-data.d.ts"/>
interface Window {
    app: any;
    fakeDb: any;
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

declare var $ : any;

declare module "modules/channels/OverTlecBuilder" {
    export = $;
}
declare module "modules/channels/Route" {
    export = $;
}
declare module "modules/channels/Tlec" {
    export = $;
}
declare module "modules/channels/TlecBuilder" {
    export = $;
}
declare module "modules/channels/Tlgr" {
    export = $;
}
declare module "modules/channels/Tlht" {
    export = $;
}
declare module "modules/channels/TlhtBuilder" {
    export = $;
}
declare module "modules/channels/Tlke" {
    export = $;
}
declare module "modules/channels/TlkeBuilder" {
    export = $;
}
declare module "modules/crypto-js/enc-base64" {
    export = $;
}
declare module "modules/crypto-js/enc-hex" {
    export = $;
}
declare module "modules/crypto-js/enc-utf8" {
    export = $;
}
declare module "modules/cryptography/random" {
    export = $;
}
declare module "modules/dictionary/dictionary" {
    export = $;
}
declare module "modules/events/eventEmitter" {
    export = $;
}
declare module "modules/filter/Filter" {
    export = $;
}
declare module "modules/forge" {
    export = $;
}
declare module "modules/invariant" {
    export = $;
}
declare module "modules/leemon/BigInt" {
    export = $;
}
declare module "modules/multivalue/base64" {
    export = $;
}
declare module "modules/multivalue/base64url" {
    export = $;
}
declare module "modules/multivalue/bigIntForge" {
    export = $;
}
declare module "modules/multivalue/bigIntSjcl" {
    export = $;
}
declare module "modules/multivalue/bitArray" {
    export = $;
}
declare module "modules/multivalue/byteBuffer" {
    export = $;
}
declare module "modules/multivalue/bytes" {
    export = $;
}
declare module "modules/multivalue/converter" {
    export = $;
}
declare module "modules/multivalue/decBlocks" {
    export = $;
}
declare module "modules/multivalue/hex" {
    export = $;
}
declare module "modules/multivalue/multivalue" {
    export = $;
}
declare module "modules/multivalue/utf8string" {
    export = $;
}
declare module "modules/multivalue/x32wordArray" {
    export = $;
}
declare module "modules/serialization/SerializationContext" {
    export = $;
}
declare module "modules/serialization/SerializationPacket" {
    export = $;
}
declare module "modules/serialization/serializable" {
    export = $;
}
declare module "modules/sjcl/bitArray" {
    export = $;
}
declare module "modules/sjcl/bn" {
    export = $;
}
declare module "modules/sjcl/codecBase64" {
    export = $;
}
declare module "modules/sjcl/codecBytes" {
    export = $;
}
declare module "modules/sjcl/codecHex" {
    export = $;
}
declare module "modules/sjcl/codecString" {
    export = $;
}
declare module "modules/tools" {
    export = $;
}
declare module "modules/urandom/urandom" {
    export = $;
}
declare module "react" {
    export = $;
}
declare module "uuid" {
    export = $;
}
declare module "zepto" {
    export = $;
}

