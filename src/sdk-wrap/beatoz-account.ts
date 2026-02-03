/** @format */

import { Web3Account } from '@beatoz/web3-accounts';
import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';
import { BeatozChain } from './beatoz-chain';
import {BeatozTransferTx} from "./transactions";

export class BeatozAccount {
  readonly beatozChain: BeatozChain;
  readonly account: Web3Account;

  static newAccount(beatozChain: BeatozChain) {
    const web3Account = beatozChain.web3.beatoz.accounts.create()
    return new BeatozAccount(beatozChain, web3Account)
  }

  static fromPrivateKey(beatozChain: BeatozChain, privateKey: string) {
    return beatozChain.getBeatozAccount(privateKey);
  }

  constructor(beatozChain: BeatozChain, account: Web3Account) {
    this.beatozChain = beatozChain;
    this.account = account;
  }

  get address() {
    return this.account.address;
  }

  async nonce() {
    const accountResponse = await this.beatozChain.getAccount(this.account.address);
    return accountResponse.value.nonce;
  }

  async balance() {
    const accountResponse = await this.beatozChain.getAccount(this.account.address);
    return accountResponse.value.balance;
  }

  async send(toAddress: string, amount: string) {
    return await (new BeatozTransferTx(this.beatozChain).transfer(this, toAddress, amount))
  }

  signTransaction(trxProto: TrxProto) {
    return this.account.signTransaction(trxProto, this.beatozChain.chainId);
  }
}
