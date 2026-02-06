/** @format */

import {
  BeatozAccount,
  BeatozChain,
  ContractJsonReader,
  BeatozContractDeployer,
  DEFAULT_GAS,
} from '../sdk-wrap';
import { Address } from '@beatoz/web3';
import { TokenBtip10Core } from './token-btip10-core';

export class PermissionStableBTIP10Client extends TokenBtip10Core {
  static CONTRACT_NAME = 'PermissionStableBTIP10';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    owner: string,
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    const contractAddress = await contractDeployer.deploy(
      this.CONTRACT_NAME,
      deployAccount,
      [tokenName, tokenSymbol, owner],
      gas
    );
    return contractAddress;
  }

  static create(
    btzWeb3: BeatozChain,
    contractJsonReader: ContractJsonReader,
    contractAddress: string,
    linkerEndpointContractName: string
  ): PermissionStableBTIP10Client {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName);
    return new PermissionStableBTIP10Client(
      btzWeb3,
      contractAddress,
      contractJson,
      linkerEndpointContractJson
    );
  }

  constructor(
    btzWeb3: BeatozChain,
    contractAddress: string,
    contractJson: any,
    linkerEndpointContractJson: any
  ) {
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

  async setLinkerEndpoint(ownerAccount: BeatozAccount, endpointAddress: string, gas: number = 3500000) {
    const methodAbi = await this.contract.methods.setLinkerEndpoint(endpointAddress).encodeABI();
    const signedTx = await this.buildSignedTransaction(
      ownerAccount,
      this.contractAddress,
      '0',
      methodAbi,
      gas
    );
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? 'setLinkerEndpoint failed');
    }
    return txResult;
  }

  /** Owner: grant/revoke permissions */
  async setCanSend(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setCanSend(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setCanReceive(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setCanReceive(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setMintRole(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setMintRole(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setBurnRole(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setBurnRole(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async freeze(from: BeatozAccount, account: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.freeze(account).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async unfreeze(from: BeatozAccount, account: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.unfreeze(account).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setPaused(from: BeatozAccount, paused: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setPaused(paused).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async getPermissionStatus(account: string) {
    const res = await this.contract.methods.getPermissionStatus(account).call();
    return res;
  }

  async isPaused(): Promise<boolean> {
    const res = await this.contract.methods.isPaused().call();
    return res as unknown as boolean;
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
