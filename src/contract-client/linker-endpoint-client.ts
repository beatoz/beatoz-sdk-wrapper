import { BeatozAccount, BeatozChain, BeatozContract, ContractJsonReader, BeatozContractDeployer } from '../sdk-wrap';

export class LinkerEndpointClient extends BeatozContract {
  static CONTRACT_NAME = 'LinkerEndpoint';

  static async deploy(contractDeployer: BeatozContractDeployer, deployAccount: BeatozAccount) {
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, []);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new LinkerEndpointClient(btzWeb3, contractAddress, contractJson);
  }

  async linkerChannels(dAppAddress: string) {
    const result = await this.contract.methods.linkerChannels(dAppAddress).call();
    const addr = this.beatozChain.beatozConverter().convertAddress(result);
    return addr;
  }
}
