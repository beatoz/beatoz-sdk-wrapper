import {ContractJsonReader} from "./contract-json-reader";
import {BeatozChain} from "./beatoz-chain";
import {BeatozAccount} from "./beatoz-account";
import {BeatozTxResult} from "./beatoz-tx-result";
import {ContractJson} from "./contract-json";
import {setTimeout} from "timers/promises";

export class BeatozContractDeployer {

    constructor(
        readonly beatozChain: BeatozChain,
        readonly contractJsonReader: ContractJsonReader
    ) {}

    async deploy2(contractJsonFilePath: string, deployAccount: BeatozAccount, args: any[], gas: number = 20000000) {
      const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath)
      return await this.doDeploy(contractJson, args, deployAccount, gas)
    }

    async deploy(contractName: string, deployAccount: BeatozAccount, args: any[], gas: number = 20000000) {
      const contractJson = this.contractJsonReader.readContractJson(contractName)
      return await this.doDeploy(contractJson, args, deployAccount, gas)
    }

    private async doDeploy(contractJson: ContractJson, args: any[], deployAccount: BeatozAccount, gas: number) {
      const contract = new this.beatozChain.web3.beatoz.Contract(contractJson.abi())
      const txResponse = await contract.deploy(
          contractJson.bytecode(),
          args,
          deployAccount.account,
          this.beatozChain.chainId,
          gas,
      ).send();

      const beatozTxResult = BeatozTxResult.fromTxCommitResponse(txResponse)
      if (beatozTxResult.isFailed) {
        console.log("doDeploy failed")
        return ""
      }

      const contractAddress = beatozTxResult.returnData
      return contractAddress
    }

    private async contractAddressFromTxHash(txHash: string) {
      return await this.beatozChain.web3.beatoz.contractAddrFromTx(txHash)
    }
}