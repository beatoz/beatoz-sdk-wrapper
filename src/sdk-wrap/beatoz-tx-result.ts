/** @format */
import { BroadcastTxCommitResponse, Web3 } from '@beatoz/web3';
import {Event, TxData} from '@beatoz/web3-types/lib/commonjs/responses';

enum TxErrorType {
  check_tx,
  deliver_tx,
}

export class TxGasInfo {
  constructor(
      readonly checkTxGasWanted: string,
      readonly checkTxGasUsed: string,
      readonly deliverTxGasWanted: string,
      readonly deliverTxGasUsed: string
  ) {}

  static fromTxData(checkTx: TxData, deliverTx?: TxData): TxGasInfo {
    return new TxGasInfo(
        checkTx?.gas_wanted ?? '0',
        checkTx?.gas_used ?? '0',
        deliverTx?.gas_wanted ?? '0',
        deliverTx?.gas_used ?? '0'
    );
  }
}

export class ErrorInfo {
  constructor(
    readonly errorType: TxErrorType,
    readonly code: number,
    readonly log: string,
    readonly message: string
  ) {}

  toString(): string {
    return `type: ${this.errorType}, code: ${this.code}\nlog: ${this.log}\nmessage: ${this.message}`;
  }
}

export class BeatozTxResult {
  readonly txHash: string;
  readonly height: number;
  private readonly result: boolean;
  readonly returnData: string = '';
  readonly events: readonly Event[];
  readonly errorInfo: ErrorInfo | null = null;
  readonly gasInfo: TxGasInfo;
  readonly srcTxCommitResponse: BroadcastTxCommitResponse

  constructor(result: boolean, returnData: string, events: readonly Event[] = [], errorInfo: ErrorInfo | null = null, txCommitResponse: BroadcastTxCommitResponse) {
    this.txHash = txCommitResponse.hash;
    this.height = txCommitResponse.height;
    this.result = result;
    this.returnData = returnData;
    this.events = events;
    this.errorInfo = errorInfo;
    this.gasInfo = TxGasInfo.fromTxData(txCommitResponse.check_tx, txCommitResponse.deliver_tx)
    this.srcTxCommitResponse = txCommitResponse;
  }

  get isFailed(): boolean {
    return !this.result;
  }

  get isSuccess(): boolean {
    return this.result;
  }

  get isEmptyEvent(): boolean {
    return this.events.length === 0;
  }

  get errorMsg(): string {
    return this.errorInfo ? this.errorInfo.toString() : '';
  }

  static parseEvmCallError(err: string, web3: Web3): string | null {
    err = err.toLowerCase();
    if (err.startsWith('08c379a0')) {
      return web3.beatoz.abi.decodeParameter('string', err.slice(8)) as string;
    }
    return null;
  }

  static fromTxCommitResponse(txCommitResponse: BroadcastTxCommitResponse) {
    const result = this.isSuccess(txCommitResponse);
    let returnData: string = '';
    let errorInfo: ErrorInfo | null = null;

    if (result) {
      const data = txCommitResponse.deliver_tx?.data;
      if (data !== undefined && data !== null && data !== '') {
        returnData = Buffer.from(data, 'base64').toString('hex');
      }
    } else {
      const checkTxCode = txCommitResponse.check_tx?.code;
      const deliverTxCode = txCommitResponse.deliver_tx?.code;

      if (checkTxCode !== undefined && checkTxCode !== 0) {
        errorInfo = new ErrorInfo(
          TxErrorType.check_tx,
          checkTxCode,
          txCommitResponse.check_tx?.log ?? '',
          ''
        );
      } else if (deliverTxCode !== undefined && deliverTxCode !== 0) {
        let errMsg: string | null = null;
        const data = txCommitResponse.deliver_tx?.data;
        if (data !== undefined && data !== null && data !== '') {
          errMsg = this.parseEvmCallError(Buffer.from(data, 'base64').toString('hex'), new Web3('https://'));
        }
        errorInfo = new ErrorInfo(
          TxErrorType.deliver_tx,
          deliverTxCode,
          txCommitResponse.deliver_tx?.log ?? '',
          errMsg ?? ''
        );
      }
    }

    const events = txCommitResponse.deliver_tx?.events ?? [];
    return new BeatozTxResult(result, returnData, events, errorInfo, txCommitResponse);
  }

  static isSuccess(response: BroadcastTxCommitResponse): boolean {
    return response.check_tx?.code == 0 && response.deliver_tx?.code == 0;
  }
}
