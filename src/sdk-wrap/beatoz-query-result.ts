/** @format */
import { with0xPrefix } from './beatoz-util';

export interface RawQueryResponse {
  key: string;
  value: {
    usedGas: string;
    vmErr?: string;
    returnData: string;
  };
  height: string;
}

export class BeatozQueryResult {
  readonly key: string; // tx hash
  readonly returnData: string;
  readonly vmErr: string | undefined;
  readonly gasUsed: string;
  readonly height: string;

  constructor(
    key: string,
    returnData: string,
    vmErr: string | undefined,
    gasUsed: string,
    height: string
  ) {
    this.key = key;
    this.returnData = with0xPrefix(returnData);
    this.vmErr = vmErr;
    this.gasUsed = gasUsed;
    this.height = height;
  }

  get isSuccess(): boolean {
    return this.vmErr === undefined || this.vmErr === '';
  }

  get isFailed(): boolean {
    return !this.isSuccess;
  }

  get errorMsg(): string {
    if (this.isSuccess) {
      return '';
    }
    return this.vmErr!.replace(/^"|"$/g, '');
  }

  static fromQueryResponse(response: RawQueryResponse): BeatozQueryResult {
    return new BeatozQueryResult(
        response.key,
        response.value?.returnData ?? '',
        response.value?.vmErr,
        response.value?.usedGas ?? '0',
        response.height
    );
  }

  // decode(contractInterface: Interface, methodName: string): Result {
  //   if (this.isFailed) {
  //     throw new Error(`query "${methodName}" failed: ${this.errorMsg}`);
  //   }
  //   return contractInterface.decodeFunctionResult(methodName, this.returnData);
  // }

  toString(): string {
    return `key: ${this.key}, height: ${this.height}, gasUsed: ${this.gasUsed}, ${
      this.isSuccess ? `returnData: ${this.returnData}` : `error: ${this.errorMsg}`
    }`;
  }
}
