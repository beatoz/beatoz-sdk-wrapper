import { BeatozAccount, BeatozChain, ContractJsonReader, BeatozContractDeployer } from '../sdk-wrap';
import { TokenBTIP10Client } from './token-btip10-client';

export class Btip10StablecoinClient extends TokenBTIP10Client {
  static CONTRACT_NAME = 'BTIP10Stablecoin';

  static async deploy2(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    owner: string
  ) {
    const contractAddress = await contractDeployer.deploy(Btip10StablecoinClient.CONTRACT_NAME, deployAccount, [
      tokenName,
      tokenSymbol,
      owner,
    ]);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string, linkerEndpointContractName: string) {
    const btip10StablecoinContractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName);

    return new Btip10StablecoinClient(btzWeb3, contractAddress, btip10StablecoinContractJson, linkerEndpointContractJson);
  }

  constructor(btzWeb3: BeatozChain, contractAddress: string, contractJson: any, linkerEndpointContractJson: any) {
    super(btzWeb3, contractAddress, contractJson, linkerEndpointContractJson);
  }
}
