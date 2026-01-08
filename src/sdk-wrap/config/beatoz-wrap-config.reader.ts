/** @format */

import path from "path"
import fs from "fs"
import { BeatozWrapConfig, BeatozNetworkInfo } from "./beatoz-wrap.config"

export class BeatozWrapConfigReader {
	static DEFAULT_CONFIG_DIR = "./config"
	// static DEFAULT_CONFIG_FILE = "beatoz.facade.config.json"
	static DEFAULT_CONFIG_FILE = "beatoz.network.json"

	static loadDefault(configDirPath: string): BeatozWrapConfig {
		const configFilePath = path.join(configDirPath, this.DEFAULT_CONFIG_FILE)
		return this.fromFile(configFilePath)
	}

	static fromFile(filePath: string): BeatozWrapConfig {
		if (!fs.existsSync(filePath)) {
			throw new Error(`Network configuration file not found: ${filePath}`)
		}

		const fileContent = fs.readFileSync(filePath, "utf-8")
		const config = JSON.parse(fileContent)

		return this.fromJSON(config)
	}

	static fromJSON(json: any): BeatozWrapConfig {
		if (!json.beatozNetworks) {
			throw new Error("Missing required field: beatozNetworks")
		}
		if (!json.beatozNetworks.testnet) {
			throw new Error("Missing required field: beatozNetworks.testnet")
		}
		if (!json.beatozNetworks.devnet) {
			throw new Error("Missing required field: beatozNetworks.devnet")
		}
		if (!json.contractJsonDir) {
			throw new Error("Missing required field: contractJsonDir")
		}

		this.validateNetworkInfo(json.beatozNetworks.testnet, "testnet")
		this.validateNetworkInfo(json.beatozNetworks.devnet, "devnet")

		return new BeatozWrapConfig(json.beatozNetworks as BeatozNetworkInfo, json.contractJsonDir)
	}

	private static validateNetworkInfo(networkInfo: any, networkName: string): void {
		if (!networkInfo.chainId) {
			throw new Error(`Missing required field: ${networkName}.chainId`)
		}
		if (!networkInfo.providerUrl) {
			throw new Error(`Missing required field: ${networkName}.providerUrl`)
		}
	}
}
