import {ContractJsonReader} from "../sdk-wrap/contract-json-reader";
import {BeatozChain} from "../sdk-wrap/beatoz-chain";
import {BeatozContract} from "../sdk-wrap/beatoz-contract";

export class LinkerEndpointClient extends BeatozContract {
  static CONTRACT_NAME = "LinkerEndpoint"

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME)
    return new LinkerEndpointClient(btzWeb3, contractAddress, contractJson)
  }

  async linkerChannels(dAppAddress: string) {
    const result = await this.contract.methods.linkerChannels(dAppAddress).call()
    const addr = this.btz.beatozConverter().convertAddress(result)
    return addr
  }
}

