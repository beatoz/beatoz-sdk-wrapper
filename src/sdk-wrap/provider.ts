/** @format */
import { ContractJsonReader } from "./contract-json-reader"
import { BeatozNetworkType } from "./constant"
import {BeatozChainFactory} from "./beatoz-chain-factory";
import {BeatozChain} from "./beatoz-chain";

export class Provider {
	constructor(
		readonly btzChain: BeatozChain,
		readonly contractJsonReader: ContractJsonReader
	) {}

	getBtzFacade() {
		return this.btzChain
	}

	getContractJsonReader() {
		return this.contractJsonReader
	}

	static async create(configFileAbsolutePath: string, beatozNetworkType: BeatozNetworkType) {
		return new BeatozChainFactory(configFileAbsolutePath).createBeatozProvider(beatozNetworkType)
	}
}
