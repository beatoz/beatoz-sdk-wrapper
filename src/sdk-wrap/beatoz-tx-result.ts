/** @format */
import {BroadcastTxCommitResponse, Web3} from "@beatoz/web3"
import { Event } from "@beatoz/web3-types/lib/commonjs/responses"

enum TxErrorType {
  check_tx,
  deliver_tx,
}

export class ErrorInfo {
  constructor(
      readonly errorType: TxErrorType,
      readonly code: number,
      readonly log: string,
      readonly message: string,
  ) { }
}

export class BeatozTxResult {
	readonly txHash: string
	private readonly result: boolean
    readonly returnData: string = ""
	readonly events: readonly Event[]
    readonly errorInfo: ErrorInfo | null = null

	constructor(txHash: string, result: boolean, returnData: string, events: readonly Event[] = [], errorInfo: ErrorInfo | null = null) {
		this.txHash = txHash
		this.result = result
        this.returnData = returnData
		this.events = events
        this.errorInfo = errorInfo
	}

	get isFailed(): boolean {
		return !this.result
	}

	get isSuccess(): boolean {
		return this.result
	}

	get isEmptyEvent(): boolean {
		return this.events.length === 0
	}

  static parseEvmCallError(err: string, web3: Web3): string | null {
    err = err.toLowerCase();
    if (err.startsWith('08c379a0')) {
      return web3.beatoz.abi.decodeParameter('string', err.slice(8)) as string;
    }
    return null;
  }

	static fromTxCommitResponse(txCommitResponse: BroadcastTxCommitResponse) {
		const result = this.getTxCommitResult(txCommitResponse)
      let returnData: string = ""
      let errorInfo: ErrorInfo | null = null

      if (result) {
        returnData = Buffer.from(txCommitResponse.deliver_tx!.data!, 'base64').toString('hex')
      } else {
        if (txCommitResponse.check_tx?.code != 0) {
          txCommitResponse.check_tx!.code
          txCommitResponse.check_tx!.log
          errorInfo = new ErrorInfo(TxErrorType.check_tx, txCommitResponse.check_tx!.code, txCommitResponse.check_tx!.log? txCommitResponse.check_tx!.log : "", "")
        } else if (txCommitResponse.deliver_tx?.code != 0) {
          txCommitResponse.deliver_tx!.code
          txCommitResponse.deliver_tx!.log
          const errMsg = this.parseEvmCallError(Buffer.from(txCommitResponse.deliver_tx!.data!, 'base64').toString('hex'), new Web3("https://"));
          errorInfo = new ErrorInfo(TxErrorType.deliver_tx, txCommitResponse.deliver_tx!.code, txCommitResponse.deliver_tx!.log? txCommitResponse.deliver_tx!.log : "", errMsg? errMsg : "")
        }
      }

		const events = txCommitResponse.deliver_tx?.events
		if (events == undefined) {
			throw new Error("Events not found")
		}

		return new BeatozTxResult(txCommitResponse.hash, result, returnData, events, errorInfo)
	}

	static getTxCommitResult(response: BroadcastTxCommitResponse): boolean {
		return response.check_tx?.code == 0 && response.deliver_tx?.code == 0
	}
}
