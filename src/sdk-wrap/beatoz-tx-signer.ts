/** @format */

import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';
import { BeatozSignedTransaction } from './beatoz-external-signer';

export interface BeatozTxSigner {
  readonly address: string;
  nonce(): Promise<number>;
  signTransactionAsync(trxProto: TrxProto): Promise<BeatozSignedTransaction>;
}
