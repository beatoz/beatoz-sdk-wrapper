/** @format */

import { Web3 } from "@beatoz/web3"
import {BeatozChain} from "./beatoz-chain";

export class BeatozConverter {
	readonly web3: Web3

	constructor(readonly btzWeb3: BeatozChain) {
		this.web3 = btzWeb3.web3
	}

    stringToUint2562(data: string) {
      const result = this.web3.beatoz.abi.decodeParameter("uint256", data)
      return result as bigint
    }

	convertUint256(response: any) {
		const balance = this.web3.beatoz.abi.decodeParameter("uint256", response.value.returnData)
		if (typeof balance !== "string" && typeof balance !== "number" && typeof balance !== "bigint") {
			throw new Error("Invalid balance type returned from contract")
		}
		return balance as bigint
		//return this.web3.utils.toBigInt(balance)
	}

	convertString(response: any) {
		return this.web3.beatoz.abi.decodeParameter("string", response.value.returnData) as string
	}

    convertAddress(response: any) {
      return this.web3.beatoz.abi.decodeParameter('address', response.value.returnData) as string;
    }
}
