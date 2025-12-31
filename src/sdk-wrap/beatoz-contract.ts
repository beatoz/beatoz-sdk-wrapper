/** @format */
import { TrxProtoBuilder } from "@beatoz/web3-accounts"
import { Interface } from "ethers"
import { BeatozTxResult } from "./beatoz-tx-result"
import {BeatozConverter} from "./beatoz-converter";
import {BeatozChain} from "./beatoz-chain";
import {BeatozAccount} from "./beatoz-account";

export class BeatozContract {
	readonly btz: BeatozChain
	readonly contractAddress: string
	readonly contractInterface: Interface
	readonly contract: any
    readonly converter: BeatozConverter

	constructor(btzWeb3: BeatozChain, contractAddress: string, contractJson: any) {
		if (contractAddress == undefined || contractAddress == "") {
			throw new Error("contractAddress is undefined")
		}
		this.btz = btzWeb3
		this.contractAddress = contractAddress
		this.contractInterface = new Interface(contractJson.abi)
		this.contract = new this.btz.web3.beatoz.Contract(contractJson.abi, contractAddress)
        this.converter = this.btz.beatozConverter()
	}

	async buildContractTransaction(from: BeatozAccount, to: string, amount: string, methodAbi: string, gas: number) {
		return TrxProtoBuilder.buildContractTrxProto({
			from: from.address,
			to: to,
			nonce: await from.nonce(),
			amount: amount,
			payload: { data: methodAbi },
			//gas: Number(rule.value.maxTrxGas),
			gas: gas,
			gasPrice: await this.btz.getGasPrice(),
			//type: 6,
		})
	}

	async buildSignedTransaction(from: BeatozAccount, to: string, amount: string, methodAbi: string, gas: number) {
		const contractTrxProto = await this.buildContractTransaction(from, to, amount, methodAbi, gas)
		const { rawTransaction } = from.signTransaction(contractTrxProto)
		return rawTransaction
	}

	async sendSignedTransaction(signedTransaction: string) {
		const broadcastTxResult = await this.btz.web3.beatoz.broadcastRawTxCommit(signedTransaction)
		return BeatozTxResult.fromTxCommitResponse(broadcastTxResult)
	}
}
