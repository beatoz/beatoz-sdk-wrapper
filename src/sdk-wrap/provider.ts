/** @format */
import { ContractJsonReader } from './contract-json-reader';
import { BeatozNetworkType } from './constant';
import { BeatozFactory } from './beatoz-factory';
import { BeatozChain } from './beatoz-chain';
import { BeatozContractDeployer } from './beatoz-contract-deployer';

export class Provider {
  constructor(
    readonly btzChain: BeatozChain,
    readonly contractJsonReader: ContractJsonReader,
    readonly contractDeployer: BeatozContractDeployer
  ) {}

  getBtzChain() {
    return this.btzChain;
  }

  getContractJsonReader() {
    return this.contractJsonReader;
  }

  static async create(configFileAbsolutePath: string, beatozNetworkType: BeatozNetworkType) {
    return new BeatozFactory(configFileAbsolutePath).createBeatozProvider(beatozNetworkType);
  }
}

export async function createBeatozProvider(beatozConfigFilePath: string, beatozNetworkType: BeatozNetworkType) {
  return new BeatozFactory(beatozConfigFilePath).createBeatozProvider(beatozNetworkType);
}
