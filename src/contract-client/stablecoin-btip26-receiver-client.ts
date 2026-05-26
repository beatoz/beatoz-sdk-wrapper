/** @format */

import { BeatozChain, BeatozContract, BeatozContractDeployer, BeatozTxSigner, ContractJsonReader, DEFAULT_GAS } from '../sdk-wrap';

function getReturnDataHex(response: any): string | null {
  if (response == null || typeof response !== 'object') return null;
  const data = response.value?.returnData ?? response.returnData;
  if (typeof data !== 'string' || !data) return null;
  return data.startsWith('0x') ? data : `0x${data}`;
}

function toConverterShape(hex: string): { value: { returnData: string } } {
  return { value: { returnData: hex } };
}

export class StablecoinBTIP26ReceiverClient extends BeatozContract {
  static CONTRACT_NAME = 'StablecoinBTIP26Receiver';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozTxSigner,
    linkerEndpointAddress: string,
    stablecoinAddress: string,
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [linkerEndpointAddress, stablecoinAddress], gas);
  }

  static async deploy2(
    contractDeployer: BeatozContractDeployer,
    contractJsonFilePath: string,
    deployAccount: BeatozTxSigner,
    linkerEndpointAddress: string,
    stablecoinAddress: string,
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy2(contractJsonFilePath, deployAccount, [linkerEndpointAddress, stablecoinAddress], gas);
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string): StablecoinBTIP26ReceiverClient {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new StablecoinBTIP26ReceiverClient(btzWeb3, contractAddress, contractJson);
  }

  static create2(btzWeb3: BeatozChain, contractJsonFilePath: string, contractAddress: string): StablecoinBTIP26ReceiverClient {
    const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath);
    return new StablecoinBTIP26ReceiverClient(btzWeb3, contractAddress, contractJson);
  }

  async stablecoin(): Promise<string> {
    const result = await this.contract.methods.stablecoin().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertAddress(toConverterShape(hex)) : String(result ?? '');
  }

  async linkerEndpoint(): Promise<string> {
    const result = await this.contract.methods.linkerEndpoint().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertAddress(toConverterShape(hex)) : String(result ?? '');
  }

  async expectedChannelIDHash(): Promise<string> {
    return await this.readBytes32('expectedChannelIDHash');
  }

  async expectedChaincodeIDHash(): Promise<string> {
    return await this.readBytes32('expectedChaincodeIDHash');
  }

  async expectedSelector(): Promise<string> {
    return await this.readBytes32('expectedSelector');
  }

  async handledEvents(eventKey: string): Promise<boolean> {
    const result = await this.contract.methods.handledEvents(eventKey).call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bool', hex);
      return decoded === true || decoded === 'true' || decoded === '1' || decoded === BigInt(1);
    }
    return result === true || result === 'true' || result === '1';
  }

  async setLinkerEndpoint(ownerAccount: BeatozTxSigner, endpointAddress: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.setLinkerEndpoint(endpointAddress).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async setStablecoin(ownerAccount: BeatozTxSigner, stablecoinAddress: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.setStablecoin(stablecoinAddress).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async setNullifierContract(ownerAccount: BeatozTxSigner, nullifierAddress: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.setNullifierContract(nullifierAddress).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async setExpectedSource(
    ownerAccount: BeatozTxSigner,
    channelID: string,
    chaincodeID: string,
    selector: string,
    gas: number = DEFAULT_GAS
  ) {
    const methodAbi = this.contract.methods.setExpectedSource(channelID, chaincodeID, selector).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async cancelLinkerEvent(ownerAccount: BeatozTxSigner, eventRootHash: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.cancelLinkerEvent(eventRootHash).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async handleLinkerEvent(
    linkerEndpointAccount: BeatozTxSigner,
    srcBlockNumber: string | number,
    srcTxIndex: string | number,
    indices: Array<string | number>,
    values: string[],
    gas: number = DEFAULT_GAS
  ) {
    const methodAbi = this.contract.methods.handleLinkerEvent(srcBlockNumber, srcTxIndex, indices, values).encodeABI();
    return await this.executeTransaction(linkerEndpointAccount, methodAbi, gas);
  }

  private async readBytes32(methodName: string): Promise<string> {
    const result = await this.contract.methods[methodName]().call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bytes32', hex);
      return typeof decoded === 'string' ? decoded : String(decoded);
    }
    return String(result ?? '');
  }

  private async executeTransaction(from: BeatozTxSigner, methodAbi: string, gas: number) {
    const signedTx = await this.buildSignedTransaction(from, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? 'Transaction failed');
    }
    return txResult;
  }
}
