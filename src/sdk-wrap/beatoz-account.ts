/** @format */

import { Web3Account } from '@beatoz/web3-accounts';
import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';
import { BeatozChain } from './beatoz-chain';
import {BeatozTransferTx} from "./transactions";
import {
  BeatozExternalSigner,
  BeatozSignedTransaction,
} from './beatoz-external-signer';

export class BeatozAccount {
  readonly beatozChain: BeatozChain;
  readonly account?: Web3Account;
  readonly externalSigner?: BeatozExternalSigner;
  private readonly externalAddress?: string;

  static newAccount(beatozChain: BeatozChain) {
    const web3Account = beatozChain.web3.beatoz.accounts.create()
    return new BeatozAccount(beatozChain, web3Account)
  }

  static fromPrivateKey(beatozChain: BeatozChain, privateKey: string) {
    return beatozChain.getBeatozAccount(privateKey);
  }

  static fromExternalSigner(
    beatozChain: BeatozChain,
    address: string,
    externalSigner: BeatozExternalSigner,
  ) {
    return new BeatozAccount(beatozChain, undefined, externalSigner, address);
  }

  constructor(
    beatozChain: BeatozChain,
    account?: Web3Account,
    externalSigner?: BeatozExternalSigner,
    externalAddress?: string,
  ) {
    this.beatozChain = beatozChain;
    this.account = account;
    this.externalSigner = externalSigner;
    this.externalAddress = externalAddress;
  }

  get address() {
    return this.account?.address || this.externalAddress || this.externalSigner?.address || '';
  }

  get hasLocalSigner() {
    return !!this.account;
  }

  async nonce() {
    const accountResponse = await this.beatozChain.getAccount(this.address);
    return accountResponse.value.nonce;
  }

  async balance() {
    const accountResponse = await this.beatozChain.getAccount(this.address);
    return accountResponse.value.balance;
  }

  async send(toAddress: string, amount: string) {
    return await (new BeatozTransferTx(this.beatozChain).transfer(this, toAddress, amount))
  }

  signTransaction(trxProto: TrxProto) {
    if (!this.account) {
      throw new Error('Local signer is not available. Use signTransactionAsync() for external signers.');
    }
    return this.account.signTransaction(trxProto, this.beatozChain.chainId);
  }

  async signTransactionAsync(trxProto: TrxProto): Promise<BeatozSignedTransaction> {
    if (this.account) {
      const { rawTransaction, transactionHash } = this.account.signTransaction(
        trxProto,
        this.beatozChain.chainId,
      );
      return {
        rawTransaction,
        transactionHash,
      };
    }

    if (!this.externalSigner) {
      throw new Error('No signer configured for this account');
    }

    return await this.externalSigner.signTransaction({
      trxProto,
      chainId: this.beatozChain.chainId,
      from: this.address,
    });
  }
}
