/** @format */

export class StablecoinInfo {
	readonly chainType: string
	readonly chainId: string
	readonly contractAddress: string
	readonly mintAmount: string

	constructor(chainType: string, chainId: string, contractAddress: string, mintAmount: string) {
		this.chainType = chainType
		this.chainId = chainId
		this.contractAddress = contractAddress
		this.mintAmount = mintAmount
	}
}
