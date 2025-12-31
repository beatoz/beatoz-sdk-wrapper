/** @format */
import { BeatozNetworkType } from "../constant"

export interface NetworkInfo {
	chainId: string
	providerUrl: string
}

export type BeatozNetworkInfo = {
	[K in BeatozNetworkType]: NetworkInfo
}

export class BeatozFacadeConfig {
	private networks: BeatozNetworkInfo
	private contractJsonDir: string

	constructor(networks: BeatozNetworkInfo, contractJsonDir: string) {
		this.networks = networks
		this.contractJsonDir = contractJsonDir
	}

	getNetworkUrl(networkType: BeatozNetworkType): string {
		return this.networks[networkType].providerUrl
	}

	getNetwork(networkType: BeatozNetworkType): NetworkInfo {
		return this.networks[networkType]
	}

	getAllNetworks(): BeatozNetworkInfo {
		return this.networks
	}

	getNetworkTypes(): BeatozNetworkType[] {
		return Object.keys(this.networks) as BeatozNetworkType[]
	}

	getContractJsonDir(): string {
		return this.contractJsonDir
	}
}
