import { createHash } from 'crypto';
import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';
import { TrxProtoUtils } from '@beatoz/web3-accounts';

// `@beatoz/web3-accounts` does not publicly export the RLP encoder yet.
// Keep the internal import here so app-layer custody adapters don't need to
// couple to package internals.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RlpUtils } = require('@beatoz/web3-accounts/lib/commonjs/tx/trx_rlp.js');

export interface BeatozUnsignedTransactionContext {
  trxProto: TrxProto;
  chainId: string;
  from: string;
}

export interface BeatozSignedTransaction {
  rawTransaction: string;
  transactionHash?: string | null;
}

export interface BeatozExternalSigningPayload {
  encodedTransaction: Uint8Array;
  prefixedMessage: Buffer;
  messageHash: string;
}

export interface BeatozExternalSigner {
  readonly address: string;
  signTransaction(
    context: BeatozUnsignedTransactionContext,
  ): Promise<BeatozSignedTransaction>;
}

export function prepareBeatozExternalSigningPayload(
  context: BeatozUnsignedTransactionContext,
): BeatozExternalSigningPayload {
  const encodedData = RlpUtils.encodeTrxProto(context.trxProto);
  const prefix = `\x19BEATOZ(${context.chainId}) Signed Message:\n${encodedData.length}`;
  const prefixedMessage = Buffer.concat([Buffer.from(prefix), Buffer.from(encodedData)]);

  return {
    encodedTransaction: encodedData,
    prefixedMessage,
    messageHash: sha256Hex(prefixedMessage),
  };
}

export function normalizeBeatozExternalSignatureHex(signature: string): string {
  const hex = stripHexPrefix(signature);
  if (hex.length !== 130) {
    return hex;
  }

  const recoveryIdHex = hex.slice(128, 130).toLowerCase();
  if (recoveryIdHex === '1b' || recoveryIdHex === '1c') {
    const normalizedRecoveryId = (parseInt(recoveryIdHex, 16) - 27)
      .toString(16)
      .padStart(2, '0');
    return `${hex.slice(0, 128)}${normalizedRecoveryId}`;
  }

  return hex;
}

export function buildBeatozSignedTransaction(
  context: BeatozUnsignedTransactionContext,
  ecdsaSignature: string,
): BeatozSignedTransaction {
  context.trxProto.sig = Uint8Array.from(
    Buffer.from(normalizeBeatozExternalSignatureHex(ecdsaSignature), 'hex'),
  );
  const rawBytes = Buffer.from(TrxProtoUtils.encode(context.trxProto).finish());

  return {
    rawTransaction: rawBytes.toString('base64'),
    transactionHash: sha256Hex(rawBytes),
  };
}

function stripHexPrefix(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

function sha256Hex(value: Uint8Array | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}
