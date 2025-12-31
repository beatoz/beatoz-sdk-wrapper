/** @format */
import { ContractJsonReader } from "../sdk-wrap/contract-json-reader"
import { StableCoinClient } from "./stablecoin-client"
import { StablecoinIssuanceClient } from "./stablecoin-issuance-client"
import {BeatozChain} from "../sdk-wrap/beatoz-chain";

export class ContractClientFactory {
	constructor(
		private readonly btzFacade: BeatozChain,
		readonly jsonReader: ContractJsonReader
	) {}

	createStablecoinIssuanceClient(contractAddress: string) {
		const contractJson = this.jsonReader.readContractJson(StablecoinIssuanceClient.CONTRACT_NAME)
		return new StablecoinIssuanceClient(this.btzFacade, contractAddress, contractJson)
	}

	createErc20Client(contractAddress: string) {
		const erc20ContractJson = this.jsonReader.readContractJson(StableCoinClient.CONTRACT_NAME)
		return new StableCoinClient(this.btzFacade, contractAddress, erc20ContractJson)
	}
}
