/** @format */
import { TrxProtoBuilder } from '@beatoz/web3-accounts';
import { Interface } from 'ethers';
import { BeatozTxResult } from './beatoz-tx-result';
import { BeatozConverter } from './beatoz-converter';
import { BeatozChain } from './beatoz-chain';
import { BeatozAccount } from './beatoz-account';
import { ContractJson } from './contract-json';

export class BeatozContract {
  readonly beatozChain: BeatozChain;
  readonly contractAddress: string;
  protected readonly contractInterface: Interface;
  protected readonly contract: any;
  protected readonly converter: BeatozConverter;

  constructor(beatozChain: BeatozChain, contractAddress: string, contractJson: ContractJson) {
    if (contractAddress == undefined || contractAddress == '') {
      throw new Error('contractAddress is undefined');
    }
    this.beatozChain = beatozChain;
    this.contractAddress = contractAddress;
    this.contractInterface = new Interface(contractJson.abi());
    this.contract = new this.beatozChain.web3.beatoz.Contract(contractJson.abi(), contractAddress);
    this.converter = this.beatozChain.beatozConverter();
  }

  get chainType() {
    return this.beatozChain.chainType;
  }

  get chainId() {
    return this.beatozChain.chainId;
  }

  async buildContractTransaction(from: BeatozAccount, to: string, amount: string, methodAbi: string, gas: number) {
    return TrxProtoBuilder.buildContractTrxProto({
      from: from.address,
      to: to,
      nonce: await from.nonce(),
      amount: amount,
      payload: { data: methodAbi },
      //gas: Number(rule.value.maxTrxGas),
      gas: gas,
      gasPrice: await this.beatozChain.getGasPrice(),
      //type: 6,
    });
  }

  async buildSignedTransaction(from: BeatozAccount, to: string, amount: string, methodAbi: string, gas: number) {
    const contractTrxProto = await this.buildContractTransaction(from, to, amount, methodAbi, gas);
    const { rawTransaction } = from.signTransaction(contractTrxProto);
    return rawTransaction;
  }

  async sendSignedTransaction(signedTransaction: string) {
    const broadcastTxResult = await this.beatozChain.web3.beatoz.broadcastRawTxCommit(signedTransaction);
    return BeatozTxResult.fromTxCommitResponse(broadcastTxResult);
  }
}
