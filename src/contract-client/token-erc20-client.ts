import {
  BeatozAccount,
  BeatozChain,
  ContractJsonReader,
  BeatozContractDeployer, DEFAULT_GAS,
} from '../sdk-wrap';
import {BaseErc20Client} from "./base-erc20-client";

export class TokenErc20Client extends BaseErc20Client {
  static CONTRACT_NAME = 'TokenERC20';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    initSupply: string,
    gas: number = DEFAULT_GAS
  ) {
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [tokenName, tokenSymbol, initSupply], gas);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new TokenErc20Client(btzWeb3, contractAddress, contractJson);
  }
}
