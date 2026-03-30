import { TrxProtoBuilder } from '@beatoz/web3-accounts';
import { encodeParameters, isAbiConstructorFragment } from '@beatoz/web3-abi';
import { ContractJsonReader } from './contract-json-reader';
import { BeatozChain } from './beatoz-chain';
import { BeatozTxSigner } from './beatoz-tx-signer';
import { BeatozTxResult } from './beatoz-tx-result';
import { ContractJson } from './contract-json';
import { TrxProto } from '@beatoz/web3-types/lib/commonjs/trx_proto';

export const DEFAULT_GAS = 2000000; // 10000000
const DEPLOY_TO_ADDRESS = '0000000000000000000000000000000000000000';

export class BeatozContractDeployer {
  constructor(
    readonly beatozChain: BeatozChain,
    readonly contractJsonReader: ContractJsonReader
  ) {}

  async deploy2(contractJsonFilePath: string, deployAccount: BeatozTxSigner, args: any[], gas: number = DEFAULT_GAS) {
    const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath);
    return await this.doDeploy(contractJson, args, deployAccount, gas);
  }

  async deploy(contractName: string, deployAccount: BeatozTxSigner, args: any[], gas: number = DEFAULT_GAS) {
    const contractJson = this.contractJsonReader.readContractJson(contractName);
    return await this.doDeploy(contractJson, args, deployAccount, gas);
  }

  async buildDeployTransaction(
    contractJson: ContractJson,
    deployAccount: BeatozTxSigner,
    args: any[],
    gas: number = DEFAULT_GAS
  ): Promise<TrxProto> {
    const deployData = this.buildDeployData(contractJson, args);
    return TrxProtoBuilder.buildContractTrxProto({
      from: deployAccount.address,
      to: DEPLOY_TO_ADDRESS,
      nonce: await deployAccount.nonce(),
      gas,
      gasPrice: await this.beatozChain.getGasPrice(),
      amount: '0',
      payload: { data: deployData },
    });
  }

  async buildSignedDeployTransaction(
    contractJson: ContractJson,
    deployAccount: BeatozTxSigner,
    args: any[],
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    const trxProto = await this.buildDeployTransaction(contractJson, deployAccount, args, gas);
    const { rawTransaction } = await deployAccount.signTransactionAsync(trxProto);
    return rawTransaction;
  }

  async sendSignedDeployTransaction(signedTransaction: string): Promise<BeatozTxResult> {
    const txResponse = await this.beatozChain.web3.beatoz.broadcastRawTxCommit(signedTransaction);

    const beatozTxResult = BeatozTxResult.fromTxCommitResponse(txResponse);
    if (beatozTxResult.isFailed) {
      console.log(`contract deploy failed: ${beatozTxResult.errorInfo?.toString()}`);
      throw new Error(`contract deploy failed: ${beatozTxResult.errorInfo?.toString()}`);
    }

    return beatozTxResult;
  }

  private async doDeploy(contractJson: ContractJson, args: any[], deployAccount: BeatozTxSigner, gas: number) {
    const signedTransaction = await this.buildSignedDeployTransaction(contractJson, deployAccount, args, gas);
    const beatozTxResult = await this.sendSignedDeployTransaction(signedTransaction);

    const contractAddress = await this.contractAddressFromTxHash(beatozTxResult.txHash)
  }

  buildDeployData(contractJson: ContractJson, args: any[]): string {
    const bytecode = contractJson.bytecode();
    const constructorAbi = contractJson.abi().find((fragment: any) => isAbiConstructorFragment(fragment));

    if (!constructorAbi || !constructorAbi.inputs || constructorAbi.inputs.length === 0) {
      return bytecode;
    }

    if (!args || args.length === 0) {
      return bytecode;
    }

    const encodedArguments = encodeParameters(constructorAbi.inputs, args);
    return `${bytecode}${encodedArguments.slice(2)}`;
  }

  private async contractAddressFromTxHash(txHash: string) {
    const maxRetries = 10;
    let retries = 0;
    let contractAddress: string = "";
    do {
      await new Promise(resolve => setTimeout(resolve, 100));
      contractAddress = await this.beatozChain.web3.beatoz.contractAddrFromTx(txHash);
      retries++;
    } while (contractAddress === "" && retries < maxRetries);

    if (contractAddress === "") {
      throw new Error(`Failed to get contract address from tx: ${txHash}`);
    }

    return contractAddress;
  }
}
