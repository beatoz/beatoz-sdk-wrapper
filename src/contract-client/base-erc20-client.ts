import { BeatozTxSigner, BeatozContract, BeatozConverter, BeatozEvmEventService, DEFAULT_GAS } from '../sdk-wrap';

export abstract class BaseErc20Client extends BeatozContract {
  readonly converter: BeatozConverter = this.beatozChain.beatozConverter();
  readonly evmEventService = new BeatozEvmEventService(this.contractInterface, this.contractAddress);

  async owner(): Promise<string> {
    const response = await this.contract.methods.owner().call();
    return this.converter.convertString(response);
  }

  async totalSupply() {
    const response = await this.contract.methods.totalSupply().call();
    return this.converter.convertUint256(response);
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

  async decimals() {
    const result = await this.contract.methods.decimals().call();
    return this.converter.convertString(result);
  }

  async transferFrom(signer: BeatozTxSigner, fromAddress: string, toAddress: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.transferFrom(fromAddress, toAddress, amount).encodeABI();
    const signedTx = await this.buildSignedTransaction(signer, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    return txResult;
  }

  async approve(fromAccount: BeatozTxSigner, spender: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.approve(spender, amount).encodeABI();
    const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    return txResult;
  }

  async allowance(owner: string, spender: string) {
    const result = await this.contract.methods.allowance(owner, spender).call();
    return this.converter.convertUint256(result);
  }

  async transfer(fromAccount: BeatozTxSigner, toAddress: string, amount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.transfer(toAddress, amount).encodeABI();
    const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    return txResult;
  }
}
