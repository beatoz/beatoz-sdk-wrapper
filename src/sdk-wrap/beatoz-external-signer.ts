import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';

export interface BeatozUnsignedTransactionContext {
  trxProto: TrxProto;
  chainId: string;
  from: string;
}

export interface BeatozSignedTransaction {
  rawTransaction: string;
  transactionHash?: string | null;
}

export interface BeatozExternalSigner {
  readonly address: string;
  signTransaction(
    context: BeatozUnsignedTransactionContext,
  ): Promise<BeatozSignedTransaction>;
}
