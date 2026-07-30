import {
  BeatozAccount,
  BeatozChain,
  BeatozContract,
  BeatozContractDeployer,
  BeatozProvider,
  ContractJsonReader,
  DEFAULT_GAS,
  with0xPrefix
} from "../../../sdk-wrap";
import {BeatozQueryResult} from "../../../sdk-wrap/beatoz-query-result";

export enum ConfigGroup {
  APPLICATION = 0,
  ORDERER = 1,
}

export enum ImplicitMetaRule {
  ANY = 0,
  ALL = 1,
  MAJORITY = 2,
}

export interface ImplicitMeta {
  group: ConfigGroup;
  subPolicy: string;
  implicitRule: ImplicitMetaRule;
}

export class LinkerPolicyClient extends BeatozContract {
  static CONTRACT_NAME = 'LinkerPolicy';

  static async deploy(contractDeployer: BeatozContractDeployer, deployAccount: BeatozAccount, gas: number = DEFAULT_GAS) {
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [], gas);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new LinkerPolicyClient(btzWeb3, contractAddress, contractJson);
  }

  async initPolicy(ownerAccount: BeatozAccount, genesisPolicy: string, gas: number = 4_500_000) {
    const txResult = await this.invoke(ownerAccount, "initPolicy", [with0xPrefix(genesisPolicy)], gas)
    return txResult
  }

  async syncPolicy(ownerAccount: BeatozAccount, data: string, signatures: any[], mspCerts: any[], messageInfo: any, gas: number = 4_500_000) {
    const txResult = await this.invoke(ownerAccount, "syncPolicy", [with0xPrefix(data), signatures, mspCerts, messageInfo], gas)
    return txResult
  }

  async verifyChannelEndorsementPolicy(msgHash: string, signatures: string[], mspIds: string[], certChains: string[][]) {
    const response = await this.query( "verifyChannelEndorsementPolicy", with0xPrefix(msgHash), signatures, mspIds, certChains)
    const queryResult = BeatozQueryResult.fromQueryResponse(response)

    if (queryResult.isFailed) {
      // const hex = "0x" + response.value.returnData
      // const decoded = new RevertDecoder(resolve(root, "artifacts/contracts")).decode(hex)
      // console.log("revert:", decoded ?? hex)
    }
    return queryResult
  }

  async verifyBlockValidationPolicy(msgHash: string, signatures: string[], mspIds: string[], certChains: string[]) {
    const queryResponse =  await this.query( "verifyBlockValidationPolicy", with0xPrefix(msgHash), signatures, mspIds, certChains)
    const queryResult = BeatozQueryResult.fromQueryResponse(queryResponse)

    if (queryResult.isFailed) {
      // const hex = "0x" + response.value.returnData
      // const decoded = new RevertDecoder(resolve(root, "artifacts/contracts")).decode(hex)
      // console.log("revert:", decoded ?? hex)
    }
    return queryResult
  }

  async decodeSecurityPolicy(data: string) {
    return await this.query( "decodeSecurityPolicy", with0xPrefix(data))
  }

  async decodeConfigPolicy(data: string) {
    return await this.query( "decodeConfigPolicy", with0xPrefix(data))
  }

  async decodeOrgPolicy(data: string) {
    return await this.query( "decodeOrgPolicy", with0xPrefix(data))
  }

  async getBlockValidationPolicy() {
    const [configPolicy] = await this.callAndDecode("getBlockValidationPolicy")
    return this.toPlain(configPolicy)
  }

  async getChannelEndorsementPolicy() {
    const [configPolicy] = await this.callAndDecode("getChannelEndorsementPolicy")
    return this.toPlain(configPolicy)
  }

  async findSubPolicies(implMeta: ImplicitMeta) {
    const [configPolicies] = await this.callAndDecode("findSubPolicies", implMeta)
    return this.toPlain(configPolicies)
  }

  async getOrgPolicy(mspId: string) {
    const [orgPolicy] = await this.callAndDecode("getOrgPolicy", mspId)
    return this.toPlain(orgPolicy)
  }

  async getOrgConfigPolicies(mspId: string) {
    const [configPolicies] = await this.callAndDecode("getOrgConfigPolicies", mspId)
    return this.toPlain(configPolicies)
  }

  async getOrgRevocationList(mspId: string): Promise<string[]> {
    const [revocationList] = await this.callAndDecode("getOrgRevocationList", mspId)
    return this.toPlain(revocationList)
  }

  async getOrdererOrgCount(): Promise<bigint> {
    const [value] = await this.callAndDecode("getOrdererOrgCount")
    return value
  }

  async getEndorserOrgCount(): Promise<bigint> {
    const [value] = await this.callAndDecode("getEndorserOrgCount")
    return value
  }

  async getOrdererOrgMspIds(): Promise<string[]> {
    const [value] = await this.callAndDecode("getOrdererOrgMspIds")
    return this.toPlain(value)
  }

  async getEndorserOrgMspIds(): Promise<string[]> {
    const [value] = await this.callAndDecode("getEndorserOrgMspIds")
    return this.toPlain(value)
  }

  async getOrgCount(group: ConfigGroup): Promise<bigint> {
    const [value] = await this.callAndDecode("getOrgCount", group)
    return value
  }

  async channelName(): Promise<string> {
    const [value] = await this.callAndDecode("channelName")
    return value
  }

  async blockNumber(): Promise<bigint> {
    const [value] = await this.callAndDecode("blockNumber")
    return value
  }

  async sequence(): Promise<bigint> {
    const [value] = await this.callAndDecode("sequence")
    return value
  }

  async lastProcessedBlockNumber(): Promise<bigint> {
    const [value] = await this.callAndDecode("lastProcessedBlockNumber")
    return value
  }

  async lastProcessedSequence(): Promise<bigint> {
    const [value] = await this.callAndDecode("lastProcessedSequence")
    return value
  }

  private toPlain(value: any): any {
    if (value == null) return value
    if (Array.isArray(value)) {
      if (typeof (value as any).toObject === "function") {
        if (value.length === 0) return []
        try {
          const obj = (value as any).toObject(false)
          const keys = Object.keys(obj)
          if (keys.length === 1 && keys[0] === "_") {
            return value.map((item: any) => this.toPlain(item))
          }
          const out: any = {}
          for (const key of keys) {
            out[key] = this.toPlain(obj[key])
          }
          return out
        } catch {
          return value.map((item: any) => this.toPlain(item))
        }
      }
      return value.map((item: any) => this.toPlain(item))
    }
    return value
  }

  private async callAndDecode(methodName: string, ...args: any[]) {
    const result = await (this.contract.methods as any)[methodName](...args).call()
    if (result.value.vmErr === undefined) {
      const returnData = result.value.returnData.startsWith('0x')
          ? result.value.returnData
          : '0x' + result.value.returnData
      const result2 = this.contractInterface.decodeFunctionResult(methodName, returnData)
      return result2;
    }
    return ""
  }
}
