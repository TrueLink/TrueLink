declare class Builder {

	constructor(factory: any);

	static STATUS_NOT_STARTED: number;
	static STATUS_OFFER_GENERATED: number;
	static STATUS_AUTH_GENERATED: number;
	static STATUS_AUTH_ERROR: number;
	static STATUS_OFFERDATA_NEEDED: number;
	static STATUS_AUTHDATA_NEEDED: number;
	static STATUS_AUTH_NEEDED: number;
	static STATUS_HT_EXCHANGE: number;
	static STATUS_ESTABLISHED: number;
	
}

export = Builder;