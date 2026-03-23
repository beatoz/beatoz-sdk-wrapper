import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';
import { BeatozChain } from '../beatoz-chain';
import { BeatozAccount } from '../beatoz-account';
import { BeatozTxResult } from '../beatoz-tx-result';

export class BeatozBaseTx {
  constructor(readonly beatozChain: BeatozChain) {}

  async buildSignedTransaction(unsignedTrxProto: TrxProto, from: BeatozAccount) {
    const { rawTransaction } = await from.signTransactionAsync(unsignedTrxProto);
    return rawTransaction;
  }

  async sendSignedTransaction(signedTransaction: string) {
    const broadcastTxResult = await this.beatozChain.web3.beatoz.broadcastRawTxCommit(signedTransaction);
    return BeatozTxResult.fromTxCommitResponse(broadcastTxResult);
  }
}
