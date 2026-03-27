import { BeatozTxSigner, BeatozChain, BeatozContractDeployer, ContractJsonReader, DEFAULT_GAS } from '../sdk-wrap';
import { TokenBtip10Core } from './token-btip10-core';

export class TokenBTIP10Client extends TokenBtip10Core {
  static CONTRACT_NAME = 'TokenBTIP10';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozTxSigner,
    tokenName: string,
    tokenSymbol: string,
    gas: number = DEFAULT_GAS
  ) {
    const tokenOwner = deployAccount.address;
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [tokenName, tokenSymbol, tokenOwner], gas);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string, linkerEndpointContractName: string) {
    const btip10TokenContractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName);

    return new TokenBTIP10Client(btzWeb3, contractAddress, btip10TokenContractJson, linkerEndpointContractJson);
  }
}
