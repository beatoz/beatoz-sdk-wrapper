import {BeatozConverter} from "../sdk-wrap/beatoz-converter";
import {PostMessage} from "./type/issue-stablecoin";
import {Interface} from "ethers";
import {ContractJsonReader} from "../sdk-wrap/contract-json-reader";
import {BeatozContract} from "../sdk-wrap/beatoz-contract";
import {BeatozEvmEventService} from "../sdk-wrap/beatoz-contract-event";
import {BeatozChain} from "../sdk-wrap/beatoz-chain";
import {BeatozAccount} from "../sdk-wrap/beatoz-account";

export class TokenBTIP10Client extends BeatozContract {
  static CONTRACT_NAME = "TokenBTIP10"
  readonly converter: BeatozConverter = this.btz.beatozConverter()
  readonly evmEventService = new BeatozEvmEventService(this.contractInterface, this.contractAddress)
  linkerEndpointEventService: BeatozEvmEventService | undefined

  readonly postMessageHash: string = ""
  readonly postMessageEventFragment: any = undefined

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string, linkerEndpointContractName: string) {
    const btip10TokenContractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME)
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName)

    return new TokenBTIP10Client(btzWeb3, contractAddress, btip10TokenContractJson, linkerEndpointContractJson)
  }

  constructor(btzWeb3: BeatozChain, contractAddress: string, contractJson: any, linkerEndpointContractJson: any) {
    super(btzWeb3, contractAddress, contractJson)

    const linkerEndpointContractInterface = new Interface(linkerEndpointContractJson.abi)
    const eventFragment = linkerEndpointContractInterface.getEvent("PostMessage")
    if (eventFragment == null) return
    this.postMessageEventFragment = eventFragment
    this.postMessageHash = eventFragment.topicHash
    this.linkerEndpointEventService = new BeatozEvmEventService(linkerEndpointContractInterface, "")
  }

  async linkerChannel() {
    let response = await this.contract.methods.linkerChannel().call();
    return this.converter.convertAddress(response);
  }

  async setLinkerEndpoint(ownerAccount: BeatozAccount, endpointContractAddress: string) {
    const methodAbi = await this.contract.methods.setLinkerEndpoint(endpointContractAddress).encodeABI()
    const signedTx = await this.buildSignedTransaction(ownerAccount, this.contractAddress, "0", methodAbi, 3500000)
    const txResult = await this.sendSignedTransaction(signedTx)

    if (txResult.isFailed) {
      throw new Error("Transaction failed")
    }

    return txResult
  }

  async postAmount(fromAccount: BeatozAccount, toChainId: string, toDAppAddr: string, toAccount: string, amount: string) {
    const methodAbi = await this.contract.methods.postAmount(toChainId, toDAppAddr, toAccount, amount).encodeABI()
    const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, "0", methodAbi, 3500000)
    const txResult = await this.sendSignedTransaction(signedTx)

    if (txResult.isFailed) {
      throw new Error("Transaction failed")
    }
    if (txResult.isEmptyEvent) {
      throw new Error("Events not found")
    }

    const postMessageEvent = this.linkerEndpointEventService!.getEvents2(txResult.events, this.postMessageHash, PostMessage)
    if (postMessageEvent === undefined) {
        throw new Error("PostMessage event not found")
    }

    const outboundMidx = this.converter.stringToUint2562(txResult.returnData)
    return outboundMidx
  }

  async getChainId() {
    const response = await this.contract.methods.getChainId().call()
    return this.converter.convertUint256(response)
  }

  async totalSupply() {
    const response = await this.contract.methods.totalSupply().call()
    return this.converter.convertUint256(response)
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