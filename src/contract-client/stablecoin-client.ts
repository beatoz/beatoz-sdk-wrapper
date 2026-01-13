/** @format */

import { BeatozAccount, BeatozContract, BeatozConverter, BeatozContractDeployer } from '../sdk-wrap';

export class StableCoinClient extends BeatozContract {
  static CONTRACT_NAME = 'BeatozStablecoin';
  readonly converter: BeatozConverter = this.beatozChain.beatozConverter();

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    decimal: number
  ) {
    const args = [tokenName, tokenSymbol, decimal.toString()];
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, args);
    return contractAddress;
  }

  async totalSupply() {
    const result = await this.contract.methods.totalSupply().call();
    return this.converter.convertUint256(result);
  }

  async balanceOf(address: string) {
    const result = await this.contract.methods.balanceOf(address).call();
    return this.converter.convertUint256(result);
  }

  async name() {
    const result = await this.contract.methods.name().call();
    return this.converter.convertString(result);
  }

  async symbol() {
    const result = await this.contract.methods.symbol().call();
    return this.converter.convertString(result);
  }

  async transfer(fromAccount: BeatozAccount, toAddress: string, amount: string) {
    const methodAbi = await this.contract.methods.transfer(toAddress, amount).encodeABI();
    const contractTrxProto = await this.buildContractTransaction(fromAccount, this.contractAddress, '0', methodAbi, 13000000);

    const { rawTransaction } = fromAccount.signTransaction(contractTrxProto);
    //const { rawTransaction } = account.signTransaction(contractTrxProto, this.btz.chainId)

    // broadcast raw transaction
    const result = await this.beatozChain.web3.beatoz.broadcastRawTxCommit(rawTransaction);
    console.log('--------------------------');
    console.log(result);
  }
}
