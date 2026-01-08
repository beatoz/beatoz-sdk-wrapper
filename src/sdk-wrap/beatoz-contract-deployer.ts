import {ContractJsonReader} from "./contract-json-reader";
import {BeatozChain} from "./beatoz-chain";
import {BeatozAccount} from "./beatoz-account";
import {BeatozTxResult} from "./beatoz-tx-result";
import {ContractJson} from "./contract-json";
import {BeatozFactory} from "./beatoz-factory";
import {createBeatozProvider} from "./provider";
import {StableCoinClient} from "../contract-client";

export class BeatozContractDeployer {

    constructor(
        readonly beatozChain: BeatozChain,
        readonly contractJsonReader: ContractJsonReader
    ) { }

    async deploy2(contractJsonFilePath: string, deployAccount: BeatozAccount, args: any[], gas: number = 20000000) {
      const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath)
      return this.doDeploy(contractJson, args, deployAccount, gas)
    }

    async deploy(contractName: string, deployAccount: BeatozAccount, args: any[], gas: number = 20000000) {
      const contractJson = this.contractJsonReader.readContractJson(contractName)
      console.log("deloy contractName: " + contractName + " args: " + args + " gas: " + gas + " deployAccount: " + deployAccount.address)
      return this.doDeploy(contractJson, args, deployAccount, gas)
    }

    private async doDeploy(contractJson: ContractJson, args: any[], deployAccount: BeatozAccount, gas: number) {
      console.log("doDeploy start")
      const contract = new this.beatozChain.web3.beatoz.Contract(contractJson.abi())
      console.log("doDeploy contraft abi")
      const bytecode = contractJson.bytecode()
      console.log("doDeploy bytecode")
      const txResponse = await contract.deploy(
          bytecode,
          args,
          deployAccount.account,
          this.beatozChain.chainId,
          gas,
      ).send();

      console.log("doDeploy deoloy")

      const beatozTxResult = BeatozTxResult.fromTxCommitResponse(txResponse)
      if (beatozTxResult.isFailed) {
        console.log("doDeploy tx failed")
        return ""
      }

      return await this.beatozChain.web3.beatoz.contractAddrFromTx(beatozTxResult.txHash)
    }
}