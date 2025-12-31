/** @format */

export class IssueStablecoin {
	constructor(
		readonly deployedStablecoinAddress: string,
		readonly mintedAmount: string
	) {}
}

export class PostMessage {
  constructor(
      readonly srcChainId: string,
      readonly srcDAppAddr: string,
      readonly srcAccount: string,
      readonly dstChainId: string,
      readonly dstDAppAddr: string,
      readonly dstAccount: string,
      readonly midx: string,
      readonly message: string,
  ) {}
}
