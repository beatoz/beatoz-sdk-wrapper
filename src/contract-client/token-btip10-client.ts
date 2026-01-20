import { Interface } from 'ethers';
import {
  BeatozAccount,
  BeatozChain,
  BeatozEvmEventService,
  ContractJsonReader,
  BeatozContractDeployer,
  ContractJson, DEFAULT_GAS,
} from '../sdk-wrap';
import { PostMessage } from './type/issue-stablecoin';
import {BaseErc20Client} from "./base-erc20-client";

export class TokenBTIP10Client extends BaseErc20Client {
  static CONTRACT_NAME = 'TokenBTIP10';
  linkerEndpointEventService: BeatozEvmEventService | undefined;

  readonly postMessageHash: string = '';
  readonly postMessageEventFragment: any = undefined;

  static async deploy(contractDeployer: BeatozContractDeployer, deployAccount: BeatozAccount, tokenName: string, tokenSymbol: string, gas: number = DEFAULT_GAS) {
    const tokenOwner = deployAccount.address;
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [tokenName, tokenSymbol, tokenOwner], gas);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string, linkerEndpointContractName: string) {
    const btip10TokenContractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName);

    return new TokenBTIP10Client(btzWeb3, contractAddress, btip10TokenContractJson, linkerEndpointContractJson);
  }

  constructor(btzWeb3: BeatozChain, contractAddress: string, btip10TokenContractJson: ContractJson, linkerEndpointContractJson: ContractJson) {
    super(btzWeb3, contractAddress, btip10TokenContractJson);

    const linkerEndpointContractInterface = new Interface(linkerEndpointContractJson.abi());
    const eventFragment = linkerEndpointContractInterface.getEvent('PostMessage');
    if (eventFragment == null) return;
    this.postMessageEventFragment = eventFragment;
    this.postMessageHash = eventFragment.topicHash;
    this.linkerEndpointEventService = new BeatozEvmEventService(linkerEndpointContractInterface, '');
  }

  async linkerChannel() {
    let response = await this.contract.methods.linkerChannel().call();
    return this.converter.convertAddress(response);
  }

  async setLinkerEndpoint(ownerAccount: BeatozAccount, endpointContractAddress: string) {
    const methodAbi = await this.contract.methods.setLinkerEndpoint(endpointContractAddress).encodeABI();
    const signedTx = await this.buildSignedTransaction(ownerAccount, this.contractAddress, '0', methodAbi, 3500000);
    const txResult = await this.sendSignedTransaction(signedTx);

    if (txResult.isFailed) {
      throw new Error('Transaction failed');
    }

    return txResult;
  }

  async postAmount(fromAccount: BeatozAccount, toChainId: string, toDAppAddr: string, toAccount: string, amount: string) {
    const methodAbi = await this.contract.methods.postAmount(toChainId, toDAppAddr, toAccount, amount).encodeABI();
    const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, '0', methodAbi, 3500000);
    const txResult = await this.sendSignedTransaction(signedTx);

    if (txResult.isFailed) {
      throw new Error('Transaction failed');
    }
    if (txResult.isEmptyEvent) {
      throw new Error('Events not found');
    }

    const postMessageEvent = this.linkerEndpointEventService!.getEvents2(txResult.events, this.postMessageHash, PostMessage);
    if (postMessageEvent === undefined) {
      throw new Error('PostMessage event not found');
    }

    const outboundMidx = this.converter.stringToUint2562(txResult.returnData);
    return outboundMidx;
  }

  async getChainId() {
    const response = await this.contract.methods.getChainId().call();
    return this.converter.convertUint256(response);
  }
}
