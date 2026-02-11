import {BeatozAccount, BeatozChain, ContractJsonReader, BeatozContractDeployer, DEFAULT_GAS} from '../sdk-wrap';
import { TokenBTIP10Client } from './token-btip10-client';
import {Address} from "@beatoz/web3";
import {TokenBtip10Core} from "./token-btip10-core";

export class Btip10StablecoinClient extends TokenBtip10Core {
  static CONTRACT_NAME = 'BTIP10Stablecoin';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    owner: string,
    gas: number = DEFAULT_GAS
  ) {
    const contractAddress = await contractDeployer.deploy(
        this.CONTRACT_NAME,
        deployAccount,
        [tokenName, tokenSymbol, owner],
        gas
    );
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

  async mint(from: BeatozAccount, to: Address, mintAmount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.mint(to, mintAmount).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async burn(from: BeatozAccount, burnAmount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.burn(burnAmount).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  private async executeTransaction(from: BeatozAccount, methodAbi: string, gas: number) {
    const signedTx = await this.buildSignedTransaction(from, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? 'Transaction failed');
    }
    return txResult;
  }
}
