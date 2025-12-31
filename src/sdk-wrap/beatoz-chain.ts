/** @format */

import { Web3 } from "@beatoz/web3"
import { Web3Account } from "@beatoz/web3-accounts"
import { BeatozConverter } from "./beatoz-converter"
import {BeatozAccount} from "./beatoz-account";

export class BeatozChain {
	readonly web3: Web3
	readonly chainType: string = "beatoz"
	readonly chainId: string

	static async create(web3: Web3) {
		let chainId = ""
		try {
			chainId = (await web3.beatoz.genesis()).chain_id
		} catch {
			// chainId remains empty string if genesis call fails
		}

		return new BeatozChain(web3, chainId)
	}

	constructor(web3: Web3, chainId: string) {
		this.web3 = web3
		this.chainId = chainId
	}

	beatozConverter() {
		return new BeatozConverter(this)
	}

	async getAccount(address: string) {
		return await this.web3.beatoz.getAccount(address)
	}

	getWeb3Account(privateKey: string): Web3Account {
		return this.web3.beatoz.accounts.privateKeyToAccount(privateKey)
	}

	getBeatozAccount(privateKey: string) {
		const account = this.web3.beatoz.accounts.privateKeyToAccount(privateKey)
		return new BeatozAccount(this, account)
	}

	async getGasPrice() {
		const rule = (await this.web3.beatoz.rule()) as any
		return rule.value.gasPrice as string
	}

	async getBalance(address: string) {
		const accountResponse = await this.web3.beatoz.getAccount(address)
		return accountResponse.value.balance
	}

	async getAccountNonce(fromAccount: Web3Account) {
		const accountResponse = await this.web3.beatoz.getAccount(fromAccount.address)
		return accountResponse.value.nonce
	}
}
