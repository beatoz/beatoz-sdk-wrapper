/** @format */

import { Web3Account } from "@beatoz/web3-accounts"
import { TrxProto } from "@beatoz/web3-types/lib/commonjs/trx_proto"
import {BeatozChain} from "./beatoz-chain";

export class BeatozAccount {
	readonly btz: BeatozChain
	readonly account: Web3Account

	static fromPrivateKey(web3: BeatozChain, privateKey: string) {
      return web3.getBeatozAccount(privateKey)
    }

	constructor(web3: BeatozChain, account: Web3Account) {
		this.btz = web3
		this.account = account
	}

	async nonce() {
		const accountResponse = await this.btz.getAccount(this.account.address)
		return accountResponse.value.nonce
	}

	async balance() {
		const accountResponse = await this.btz.getAccount(this.account.address)
		return accountResponse.value.balance
	}

	signTransaction(trxProto: TrxProto) {
		return this.account.signTransaction(trxProto, this.btz.chainId)
	}

	get address() {
		return this.account.address
	}
}
