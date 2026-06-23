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

export class StablecoinV2Client extends BeatozContract {
  static CONTRACT_NAME = 'StablecoinV2';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozTxSigner,
    tokenName: string,
    tokenSymbol: string,
    decimals: number,
    owner: string,
    initialSupply: string = '0',
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy(
      this.CONTRACT_NAME,
      deployAccount,
      [tokenName, tokenSymbol, decimals.toString(), owner, initialSupply],
      gas
    );
  }

  static async deploy2(
    contractDeployer: BeatozContractDeployer,
    contractJsonFilePath: string,
    deployAccount: BeatozTxSigner,
    tokenName: string,
    tokenSymbol: string,
    decimals: number,
    owner: string,
    initialSupply: string = '0',
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy2(
      contractJsonFilePath,
      deployAccount,
      [tokenName, tokenSymbol, decimals.toString(), owner, initialSupply],
      gas
    );
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string): StablecoinV2Client {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new StablecoinV2Client(btzWeb3, contractAddress, contractJson);
  }

  static create2(btzWeb3: BeatozChain, contractJsonFilePath: string, contractAddress: string): StablecoinV2Client {
    const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath);
    return new StablecoinV2Client(btzWeb3, contractAddress, contractJson);
  }

  async totalSupply(): Promise<bigint> {
    const result = await this.contract.methods.totalSupply().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertUint256(toConverterShape(hex)) : BigInt(String(result));
  }

  async balanceOf(address: string): Promise<bigint> {
    const result = await this.contract.methods.balanceOf(address).call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertUint256(toConverterShape(hex)) : BigInt(String(result));
  }

  async name(): Promise<string> {
    const result = await this.contract.methods.name().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertString(toConverterShape(hex)) : String(result ?? '');
  }

  async symbol(): Promise<string> {
    const result = await this.contract.methods.symbol().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertString(toConverterShape(hex)) : String(result ?? '');
  }

  async decimals(): Promise<bigint> {
    const result = await this.contract.methods.decimals().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertUint256(toConverterShape(hex)) : BigInt(String(result));
  }

  async owner(): Promise<string> {
    const result = await this.contract.methods.owner().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertAddress(toConverterShape(hex)) : String(result ?? '');
  }

  async isMinter(account: string): Promise<boolean> {
    return await this.readBool('minters', [account]);
  }

  async isBurner(account: string): Promise<boolean> {
    return await this.readBool('burners', [account]);
  }

  async setMinter(ownerAccount: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.setMinter(account, enabled).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async setBurner(ownerAccount: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.setBurner(account, enabled).encodeABI();
    return await this.executeTransaction(ownerAccount, methodAbi, gas);
  }

  async mint(minterAccount: BeatozTxSigner, to: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.mint(to, amount).encodeABI();
    return await this.executeTransaction(minterAccount, methodAbi, gas);
  }

  async burn(holderAccount: BeatozTxSigner, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.burn(amount).encodeABI();
    return await this.executeTransaction(holderAccount, methodAbi, gas);
  }

  async burnFrom(burnerAccount: BeatozTxSigner, from: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.burnFrom(from, amount).encodeABI();
    return await this.executeTransaction(burnerAccount, methodAbi, gas);
  }

  async transfer(fromAccount: BeatozTxSigner, to: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = this.contract.methods.transfer(to, amount).encodeABI();
    return await this.executeTransaction(fromAccount, methodAbi, gas);
  }

  private async readBool(methodName: string, args: unknown[]): Promise<boolean> {
    const result = await this.contract.methods[methodName](...args).call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bool', hex);
      return decoded === true || decoded === 'true' || decoded === '1' || decoded === BigInt(1);
    }
    return result === true || result === 'true' || result === '1';
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
