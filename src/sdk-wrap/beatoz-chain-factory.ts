/** @format */

import fs from "fs"
import path from "path"
import { Web3 } from "@beatoz/web3"
import { BeatozNetworkType } from "./constant"
import { ContractJsonReader } from "./contract-json-reader"
import { Provider } from "./provider"
import { BeatozFacadeConfigReader } from "./config/beatoz-facade-config.reader"
import { BeatozFacadeConfig } from "./config/beatoz-facade.config"
import {BeatozChain} from "./beatoz-chain";

export class BeatozChainFactory {
	readonly configFilePath: string
	readonly btzFacadeConfig: BeatozFacadeConfig

	// constructor(configDirPath: string) {
	// 	this.configDirPath = configDirPath
	// 	this.btzFacadeConfig = BeatozFacadeConfigReader.loadDefault(configDirPath)
	// }

	constructor(configFilePath: string) {
		this.configFilePath = configFilePath
		this.btzFacadeConfig = BeatozFacadeConfigReader.fromFile(configFilePath)
	}

	async createBeatozProvider(networkType: BeatozNetworkType) {
		const btzFacade = await this.createBtzFacade(networkType)
		const jsonReader = this.createContractJsonReader()

		return new Provider(btzFacade, jsonReader)
	}

	async createBtzFacade(netType: BeatozNetworkType): Promise<BeatozChain> {
		try {
			const web3 = this.createWeb3(netType)
			return await BeatozChain.create(web3)
		} catch (error) {
			throw new Error(`Failed to create Web3 for network type '${netType}': ${error}`)
		}
	}

	createWeb3(beatozNetworkType: BeatozNetworkType): Web3 {
		// const beatozNetworkInfo = BeatozFacadeConfigReader.loadDefault(this.configDirPath)
		const url = this.btzFacadeConfig.getNetworkUrl(beatozNetworkType)
		// const networkInfo = this.getBtzNetworkInfo(beatozNetworkType)
		return new Web3(url)
	}

	createContractJsonReader() {
		return new ContractJsonReader(this.btzFacadeConfig.getContractJsonDir())
	}

	// createContractJsonReader(contractJsonDirPath: string) {
	// 	return new ContractJsonReader(contractJsonDirPath)
	// }

	private getBtzNetworkInfo(networkType: BeatozNetworkType) {
		const networkJsonPath = path.join(this.configFilePath, "beatoz.network.json")
		const networkData = JSON.parse(fs.readFileSync(networkJsonPath, "utf-8"))

		if (!networkData[networkType]) {
			throw new Error(`Network type '${networkType}' not found. Available types: ${Object.keys(networkData).join(", ")}`)
		}

		return networkData[networkType]
	}

	// private getBtzNetworkUrl(networkType: BeatozNetworkType) {
	// 	const beatozNetworkConfig = BeatozNetworkConfig.loadDefault(this.configDirPath)
	// 	return beatozNetworkConfig.getNetworkUrl(networkType)
	// }
}
