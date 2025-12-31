/** @format */

import { BeatozConverter } from "../sdk-wrap/beatoz-converter"
import {BeatozContract} from "../sdk-wrap/beatoz-contract";
import {BeatozAccount} from "../sdk-wrap/beatoz-account";

export class StableCoinClient extends BeatozContract {
	static CONTRACT_NAME = "BeatozStablecoin"
	readonly converter: BeatozConverter = this.btz.beatozConverter()

	async totalSupply() {
		const result = await this.contract.methods.totalSupply().call()
		return this.converter.convertUint256(result)
		//return this.convertUint256(result)
		//return this.convertUint256(result.value.returnData)
	}

	async balanceOf(address: string) {
		const result = await this.contract.methods.balanceOf(address).call()
		return this.converter.convertUint256(result)
	}

	async name() {
		const result = await this.contract.methods.name().call()
		return this.converter.convertString(result)
		//return this.convertString(result)
	}

	async symbol() {
		const result = await this.contract.methods.symbol().call()
		return this.converter.convertString(result)
		//return this.convertString(result)
	}

	async transfer(fromAccount: BeatozAccount, toAddress: string, amount: string) {
		const methodAbi = await this.contract.methods.transfer(toAddress, amount).encodeABI()
		const contractTrxProto = await this.buildContractTransaction(fromAccount, this.contractAddress, "0", methodAbi, 13000000)

		const { rawTransaction } = fromAccount.signTransaction(contractTrxProto)
		//const { rawTransaction } = account.signTransaction(contractTrxProto, this.btz.chainId)

		// broadcast raw transaction
		const result = await this.btz.web3.beatoz.broadcastRawTxCommit(rawTransaction)
		console.log("--------------------------")
		console.log(result)
	}
}
