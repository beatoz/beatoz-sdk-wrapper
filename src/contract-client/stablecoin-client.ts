/** @format */

import { BeatozAccount, BeatozContract, BeatozConverter } from "../sdk-wrap";
import { BeatozContractDeployer } from "../sdk-wrap/beatoz-contract-deployer";

export class StableCoinClient extends BeatozContract {
	static CONTRACT_NAME = "BeatozStablecoin"
	readonly converter: BeatozConverter = this.btz.beatozConverter()

    static async deploy(contractDeployer: BeatozContractDeployer, deployAccount: BeatozAccount, tokenName: string, tokenSymbol: string, decimal: number) {
      const args = [tokenName, tokenSymbol, decimal.toString()]
      const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, args)
      return contractAddress
    }

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
