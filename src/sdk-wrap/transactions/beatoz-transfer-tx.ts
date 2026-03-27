import { TrxProtoBuilder } from '@beatoz/web3-accounts';
import { BeatozTxSigner } from '../beatoz-tx-signer';
import { BeatozBaseTx } from './beatoz-base-tx';

export class BeatozTransferTx extends BeatozBaseTx {
  async transfer(fromAccount: BeatozTxSigner, toAddress: string, amount: string, gas: number = 1000000) {
    const unsignedTransaction = await this.buildTransferTransaction(fromAccount, toAddress, amount, gas);
    const signedTransaction = await this.buildSignedTransaction(unsignedTransaction, fromAccount);
    return await this.sendSignedTransaction(signedTransaction);
  }

  async buildTransferTransaction(fromAccount: BeatozTxSigner, toAddress: string, amount: string, gas: number = 1000000) {
    return TrxProtoBuilder.buildTransferTrxProto({
      from: fromAccount.address,
      to: toAddress,
      nonce: await fromAccount.nonce(),
      amount: amount,
      gas: gas,
      gasPrice: await this.beatozChain.getGasPrice(),
    });
  }
}
