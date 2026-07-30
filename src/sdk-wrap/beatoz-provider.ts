/** @format */
import { ContractJsonReader } from './contract-json-reader';
import { BeatozNetworkType } from './constant';
import { BeatozFactory } from './beatoz-factory';
import { BeatozChain } from './beatoz-chain';
import { BeatozContractDeployer } from './beatoz-contract-deployer';
import {Web3} from "@beatoz/web3";

export class BeatozProvider {
  constructor(
    readonly beatozChain: BeatozChain,
    readonly contractJsonReader: ContractJsonReader,
    readonly contractDeployer: BeatozContractDeployer
  ) {}

  static async create(configFileAbsolutePath: string, beatozNetworkType: BeatozNetworkType) {
    return new BeatozFactory(configFileAbsolutePath).createBeatozProvider(beatozNetworkType);
  }

  static async createFromConfig(rpcUrl: string, chainId: string, contractJsonDirPath: string) {
    const web3 = new Web3(rpcUrl);
    const beatozChain = new BeatozChain(web3, chainId)
    const contractJsonReader = new ContractJsonReader(contractJsonDirPath)
    const contractDeployer = new BeatozContractDeployer(beatozChain, contractJsonReader)

    return new BeatozProvider(beatozChain, contractJsonReader, contractDeployer)
  }
}

export async function createBeatozProvider(beatozConfigFilePath: string, beatozNetworkType: BeatozNetworkType) {
  return new BeatozFactory(beatozConfigFilePath).createBeatozProvider(beatozNetworkType);
}
