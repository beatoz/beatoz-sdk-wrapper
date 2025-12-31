import {ContractJsonReader} from "../sdk-wrap/contract-json-reader";
import {BeatozContract} from "../sdk-wrap/beatoz-contract";
import {BeatozChain} from "../sdk-wrap/beatoz-chain";
import {BeatozAccount} from "../sdk-wrap/beatoz-account";

export class LinkerChannelClient extends BeatozContract {
  static CONTRACT_NAME = "LinkerChannel"

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const linkerChannelContractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME)
    return new LinkerChannelClient(btzWeb3, contractAddress, linkerChannelContractJson)
  }

  async getChannelId(chainId: string, dAppAddress: string) {
    const result = await this.contract.methods.getChannelId(chainId, dAppAddress).call()
    if (result.value.vmErr !== undefined) {
      return BigInt(0)
    }
    return this.btz.beatozConverter().convertUint256(result)

  }

  async addDAppChannel(ownerAccount: BeatozAccount, toChainId: string, toDAppContractAddress: string) {
    const methodAbi = await this.contract.methods.addDAppChannel(toChainId, toDAppContractAddress).encodeABI()
    const signedTx = await this.buildSignedTransaction(ownerAccount, this.contractAddress, "0", methodAbi, 3500000)
    const txResult = await this.sendSignedTransaction(signedTx)

    if (txResult.isFailed) {
      throw new Error("Transaction failed")
    }

    return txResult
  }

  async outboundMidxs(dAppChannelId: string, local: string, remote: string) {
    const response = await this.contract.methods.outboundMidxs(dAppChannelId, local, remote).call()
    if (response.value.vmErr !== undefined) {
      return BigInt(0)
    }
    return this.btz.beatozConverter().convertUint256(response)
  }

  async inboundMidxs(dAppChannelId: string, local: string, remote: string) {
    const response = await this.contract.methods.inboundMidxs(dAppChannelId, local, remote).call()
    if (response.value.vmErr !== undefined) {
      return BigInt(0)
    }
    return this.btz.beatozConverter().convertUint256(response)
  }
}

