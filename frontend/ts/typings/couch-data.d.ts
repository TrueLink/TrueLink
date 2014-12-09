//Json responce from couch server
interface ICouchFetchedPackets {
    //context: any;
    since: any;
    last_seq: any;
    results: Array<ICouchLongpollEntry>;
}
//this is what comes from the server
interface ICouchLongpollResponse {
    last_seq: number;
    results: Array<ICouchLongpollEntry>;
    since: number;
}

interface ICouchLongpollEntry {
    changes: Array<any>;
    doc: any;
    seq: number;
    id: string;
}
//==============================================
interface ICouchPackets {
    context?: any;
    since: any;
    lastSeq: any;
    packets: Array<ICouchPacket>;
}
interface ICouchPacket {
    id?: string;
    channelName : string;
    data : string;
    seq?: any;
}
// =============================================
interface ICouchMultivaluePackets {
    context?: any;
    since: any;
    lastSeq: any;
    packets: Array<ICouchMultivaluePacket>;
}

interface ICouchMultivaluePacket {
    addr: Object;//mutlivalue
    data: Object;//multivalue
    seq: number;
    id: string;
}



