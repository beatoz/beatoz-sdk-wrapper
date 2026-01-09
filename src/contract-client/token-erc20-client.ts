import {
  BeatozAccount,
  BeatozChain,
  BeatozContract,
  BeatozConverter,
  BeatozEvmEventService,
  ContractJsonReader,
  BeatozContractDeployer,
} from '../sdk-wrap';

export class TokenErc20Client extends BeatozContract {
  static CONTRACT_NAME = 'TokenERC20';
  readonly converter: BeatozConverter = this.btz.beatozConverter();
  readonly evmEventService = new BeatozEvmEventService(this.contractInterface, this.contractAddress);

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    initSupply: string
  ) {
    const contractAddress = await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [tokenName, tokenSymbol, initSupply]);
    return contractAddress;
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string) {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new TokenErc20Client(btzWeb3, contractAddress, contractJson);
  }

  async totalSupply() {
    const response = await this.contract.methods.totalSupply().call();
    return this.converter.convertUint256(response);
  }

  async balanceOf(address: string) {
    const result = await this.contract.methods.balanceOf(address).call();
    return this.converter.convertUint256(result);
  }

  async name() {
    const result = await this.contract.methods.name().call();
    return this.converter.convertString(result);
  }

  async symbol() {
    const result = await this.contract.methods.symbol().call();
    return this.converter.convertString(result);
  }

  async decimals() {
    const result = await this.contract.methods.decimals().call();
    return this.converter.convertString(result);
  }

  async transfer(fromAccount: BeatozAccount, toAddress: string, amount: string, gas: number = 3500000) {
    const methodAbi = await this.contract.methods.transfer(toAddress, amount).encodeABI();
    const signedTx = await this.buildSignedTransaction(fromAccount, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    return txResult;
  }
}
