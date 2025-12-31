/** @format */
import { BeatozConverter } from "../sdk-wrap/beatoz-converter"
import { StablecoinInfo } from "./type/stablecoin-info"
import { IssueStablecoin } from "./type/issue-stablecoin"
import {BeatozContract} from "../sdk-wrap/beatoz-contract";
import {BeatozEvmEventService} from "../sdk-wrap/beatoz-contract-event";
import {BeatozAccount} from "../sdk-wrap/beatoz-account";

export class StablecoinIssuanceClient extends BeatozContract {
	static CONTRACT_NAME = "StablecoinIssuance"
	readonly evmEventService = new BeatozEvmEventService(this.contractInterface, this.contractAddress)
	readonly btzConverter = new BeatozConverter(this.btz)

	async getContractBalance(): Promise<bigint> {
		const getBalanceResult = await this.contract.methods.getBalance().call()
		return this.btzConverter.convertUint256(getBalanceResult)
	}

	async getTotalCollateral(address: string) {
		const result = await this.contract.methods.getTotalCollateral(address).call()
		return this.btzConverter.convertUint256(result)
	}

	async getUsedCollateral(address: string) {
		const result = await this.contract.methods.getUsedCollateral(address).call()
		return this.btzConverter.convertUint256(result)
	}

	async getAvailableCollateral(address: string) {
		const result = await this.contract.methods.getAvailableCollateral(address).call()
		return this.btzConverter.convertUint256(result)
	}

	async depositCollateral(issuerAccount: BeatozAccount, depositAmount: string) {
		const methodAbi = this.contract.methods.depositCollateral().encodeABI()
		const signedTx = await this.buildSignedTransaction(issuerAccount, this.contractAddress, depositAmount, methodAbi, 3000000)
		const txResult = await this.sendSignedTransaction(signedTx)
		if (txResult.isFailed) {
			throw new Error("Transaction failed")
		}
	}
	async depositAndMintStablecoin(fromAccount: BeatozAccount, stableCoinContractAddress: string, mintAmount: string) {
		const methodAbi = this.contract.methods.mintAdditionalStablecoin(stableCoinContractAddress).encodeABI()
		const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, mintAmount, methodAbi, 3000000)
		const txResult = await this.sendSignedTransaction(signedTx)

		return txResult.isSuccess
	}

	async mintStablecoin(issuerAccount: BeatozAccount, stableCoinContractAddress: string, mintAmount: string) {
		const methodAbi = this.contract.methods.mintStablecoin(stableCoinContractAddress, mintAmount).encodeABI()
		const signedTx = await this.buildSignedTransaction(issuerAccount, this.contractAddress, "0", methodAbi, 3000000)
		const txResult = await this.sendSignedTransaction(signedTx)

		return txResult.isSuccess
	}

	async deployAndMintStablecoin(
		issuerAccount: BeatozAccount,
		stablecoinName: string,
		symbol: string,
		decimal: number,
		mintAmount: string
	) {
		const methodAbi = this.contract.methods.deployAndMintStablecoin(stablecoinName, symbol, decimal, mintAmount).encodeABI()
		const signedTx = await this.buildSignedTransaction(issuerAccount, this.contractAddress, "0", methodAbi, 3000000)
		const txResult = await this.sendSignedTransaction(signedTx)
		if (txResult.isFailed) {
			throw new Error("Transaction failed")
		}
		if (txResult.isEmptyEvent) {
			throw new Error("Events not found")
		}

		const issueStablecoinEvent = this.evmEventService.getEvents(txResult.events, IssueStablecoin)
		if (issueStablecoinEvent == undefined) {
			throw new Error("IssueStableCoin event not found")
		}

		return new StablecoinInfo(
			this.btz.chainType,
			this.btz.chainId,
			issueStablecoinEvent.deployedStablecoinAddress,
			issueStablecoinEvent.mintedAmount
		)
	}

	async depositAndDeployAndMintStablecoin(
		fromAccount: BeatozAccount,
		stableCoinName: string,
		symbol: string,
		decimal: number,
		depositAmount: string
	) {	const methodAbi = this.contract.methods.issueStablecoin(stableCoinName, symbol, decimal).encodeABI()
      const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, depositAmount, methodAbi, 3000000)
      const txResult = await this.sendSignedTransaction(signedTx)

      if (txResult.isFailed) {
        throw new Error("Transaction failed")
      }
      if (txResult.isEmptyEvent) {
        throw new Error("Events not found")
      }

      const issueStablecoinEvent = this.evmEventService.getEvents(txResult.events, IssueStablecoin)
      if (issueStablecoinEvent == undefined) {
        throw new Error("IssueStableCoin event not found")
      }

      return new StablecoinInfo(
          this.btz.chainType,
          this.btz.chainId,
          issueStablecoinEvent.deployedStablecoinAddress,
          issueStablecoinEvent.mintedAmount
      )

	}
}
