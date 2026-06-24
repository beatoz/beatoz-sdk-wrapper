/** @format */

import { BeatozChain, BeatozContractDeployer, BeatozTxResult, BeatozTxSigner, ContractJsonReader, DEFAULT_GAS } from '../sdk-wrap';
import { BaseErc20Client } from './base-erc20-client';

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface Btip26PermissionStatusResult {
  frozen: boolean;
  blacklisted: boolean;
  whitelisted: boolean;
  sendBlocked: boolean;
  receiveBlocked: boolean;
  mintRole: boolean;
  burnRole: boolean;
  userLimit: string;
  paused: boolean;
}

export interface Btip26PendingTransfer {
  sender: string;
  amount: string;
  expectedHandlerCcId: string;
  exists: boolean;
}

export interface Btip26TransferResult {
  txResult: BeatozTxResult;
  txHash: string;
  correlationId: string;
}

function with0xPrefix(value: string): string {
  if (!value) return '0x';
  return value.startsWith('0x') ? value : `0x${value}`;
}

function bytesArg(value: string): string {
  return with0xPrefix(value);
}

function bytes32Arg(value: string): string {
  const prefixed = with0xPrefix(value);
  if (!/^0x[0-9a-fA-F]{64}$/.test(prefixed)) {
    throw new Error(`Invalid bytes32 value: ${value}`);
  }
  return prefixed;
}

function getReturnDataHex(response: any): string | null {
  if (response == null || typeof response !== 'object') return null;
  const data = response.value?.returnData ?? response.returnData;
  if (typeof data !== 'string' || !data) return null;
  return with0xPrefix(data);
}

function toConverterShape(hex: string): { value: { returnData: string } } {
  return { value: { returnData: hex } };
}

function decodeEventAttributeValue(value: string): string {
  const buf = Buffer.from(value, 'base64');
  const printable = buf.every((b) => (b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9);
  return printable ? buf.toString('ascii') : `0x${buf.toString('hex')}`;
}

export class Btip26PermissionTokenClient extends BaseErc20Client {
  static CONTRACT_NAME = 'Btip26PermissionToken';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozTxSigner,
    tokenName: string,
    tokenSymbol: string,
    decimals: number,
    owner: string,
    initialSupply: string = '0',
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy(this.CONTRACT_NAME, deployAccount, [tokenName, tokenSymbol, decimals, owner, initialSupply], gas);
  }

  static async deploy2(
    contractDeployer: BeatozContractDeployer,
    contractJsonFilePath: string,
    deployAccount: BeatozTxSigner,
    tokenName: string,
    tokenSymbol: string,
    decimals: number,
    owner: string,
    initialSupply: string = '0',
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    return await contractDeployer.deploy2(
      contractJsonFilePath,
      deployAccount,
      [tokenName, tokenSymbol, decimals, owner, initialSupply],
      gas
    );
  }

  static create(btzWeb3: BeatozChain, contractJsonReader: ContractJsonReader, contractAddress: string): Btip26PermissionTokenClient {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    return new Btip26PermissionTokenClient(btzWeb3, contractAddress, contractJson);
  }

  static create2(btzWeb3: BeatozChain, contractJsonFilePath: string, contractAddress: string): Btip26PermissionTokenClient {
    const contractJson = ContractJsonReader.readContractJson(contractJsonFilePath);
    return new Btip26PermissionTokenClient(btzWeb3, contractAddress, contractJson);
  }

  async owner(): Promise<string> {
    return await this.readAddress('owner');
  }

  async decimals(): Promise<string> {
    const result = await this.contract.methods.decimals().call();
    const hex = getReturnDataHex(result);
    const decoded = hex ? this.converter.convertUint256(toConverterShape(hex)) : BigInt(result ?? 0);
    return decoded.toString();
  }

  async registry(): Promise<string> {
    return await this.readAddress('registry');
  }

  async paymentSource(): Promise<{ channelId: string; chaincodeId: string }> {
    const result = await this.contract.methods.paymentSource().call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.contractInterface.decodeFunctionResult('paymentSource', hex) as unknown as [string, string];
      return { channelId: decoded[0], chaincodeId: decoded[1] };
    }
    if (Array.isArray(result)) {
      return { channelId: String(result[0] ?? ''), chaincodeId: String(result[1] ?? '') };
    }
    return { channelId: '', chaincodeId: '' };
  }

  async expectedResultHandler(): Promise<string> {
    return await this.readString('expectedResultHandler');
  }

  async transferLogElemsSelector(): Promise<string> {
    return await this.readBytes32('transferLogElemsSelector');
  }

  async transferLogAttrsSelector(): Promise<string> {
    return await this.readBytes32('transferLogAttrsSelector');
  }

  async setRegistry(ownerAccount: BeatozTxSigner, registry: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(ownerAccount, 'setRegistry', [registry], gas);
  }

  async setPaymentSource(ownerAccount: BeatozTxSigner, channelId: string, chaincodeId: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(ownerAccount, 'setPaymentSource', [channelId, chaincodeId], gas);
  }

  async setExpectedSource(
    ownerAccount: BeatozTxSigner,
    channelId: string,
    chaincodeId: string,
    selector: string = ZERO_BYTES32,
    gas: number = DEFAULT_GAS
  ) {
    return await this.executeMethod(ownerAccount, 'setExpectedSource', [channelId, chaincodeId, bytes32Arg(selector)], gas);
  }

  async setExpectedResultHandler(ownerAccount: BeatozTxSigner, chaincodeId: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(ownerAccount, 'setExpectedResultHandler', [chaincodeId], gas);
  }

  async setMinHandleGas(ownerAccount: BeatozTxSigner, gasAmount: string | number | bigint, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(ownerAccount, 'setMinHandleGas', [gasAmount.toString()], gas);
  }

  async transferToBPrN(
    fromAccount: BeatozTxSigner,
    to: string,
    amount: string,
    beneficiary: string,
    memo: string = '0x',
    gas: number = DEFAULT_GAS
  ): Promise<Btip26TransferResult> {
    const txResult = await this.executeMethod(fromAccount, 'transferToBPrN', [to, amount, beneficiary, bytesArg(memo)], gas);
    return this.toTransferResult(txResult, 'transferToBPrN');
  }

  async burnToBPrN(
    fromAccount: BeatozTxSigner,
    amount: string,
    beneficiary: string,
    memo: string = '0x',
    gas: number = DEFAULT_GAS
  ): Promise<Btip26TransferResult> {
    const txResult = await this.executeMethod(fromAccount, 'burnToBPrN', [amount, beneficiary, bytesArg(memo)], gas);
    return this.toTransferResult(txResult, 'burnToBPrN');
  }

  async pending(correlationId: string): Promise<Btip26PendingTransfer> {
    const result = await this.contract.methods.pending(bytes32Arg(correlationId)).call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.contractInterface.decodeFunctionResult('pending', hex) as unknown as [string, bigint, string, boolean];
      return {
        sender: decoded[0],
        amount: String(decoded[1]),
        expectedHandlerCcId: decoded[2],
        exists: decoded[3],
      };
    }
    if (Array.isArray(result)) {
      return {
        sender: String(result[0] ?? ''),
        amount: String(result[1] ?? '0'),
        expectedHandlerCcId: String(result[2] ?? ''),
        exists: Boolean(result[3]),
      };
    }
    return { sender: '', amount: '0', expectedHandlerCcId: '', exists: false };
  }

  async cancelLinkerEvent(ownerAccount: BeatozTxSigner, eventRootHash: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(ownerAccount, 'cancelLinkerEvent', [bytes32Arg(eventRootHash)], gas);
  }

  async mint(from: BeatozTxSigner, to: string, amount: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'mint', [to, amount], gas);
  }

  async burn(from: BeatozTxSigner, amount: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'burn', [amount], gas);
  }

  async burnFrom(from: BeatozTxSigner, holder: string, amount: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'burnFrom', [holder, amount], gas);
  }

  async setPaused(from: BeatozTxSigner, paused: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setPaused', [paused], gas);
  }

  async isPaused(): Promise<boolean> {
    return await this.readBool('isPaused');
  }

  async setWhitelistMode(from: BeatozTxSigner, enabled: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setWhitelistMode', [enabled], gas);
  }

  async whitelistMode(): Promise<boolean> {
    return await this.readBool('whitelistMode');
  }

  async setMinter(from: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setMinter', [account, enabled], gas);
  }

  async setBurner(from: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setBurner', [account, enabled], gas);
  }

  async setMintRole(from: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setMintRole', [account, enabled], gas);
  }

  async setBurnRole(from: BeatozTxSigner, account: string, enabled: boolean, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setBurnRole', [account, enabled], gas);
  }

  async blockSend(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'blockSend', [account], gas);
  }

  async unblockSend(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'unblockSend', [account], gas);
  }

  async blockReceive(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'blockReceive', [account], gas);
  }

  async unblockReceive(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'unblockReceive', [account], gas);
  }

  async freeze(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'freeze', [account], gas);
  }

  async unfreeze(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'unfreeze', [account], gas);
  }

  async blacklist(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'blacklist', [account], gas);
  }

  async unblacklist(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'unblacklist', [account], gas);
  }

  async whitelist(from: BeatozTxSigner, account: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'whitelist', [account], gas);
  }

  async setUserLimit(from: BeatozTxSigner, account: string, limit: string, gas: number = DEFAULT_GAS) {
    return await this.executeMethod(from, 'setUserLimit', [account, limit], gas);
  }

  async getPermissionStatus(account: string): Promise<Btip26PermissionStatusResult> {
    const res = await this.contract.methods.getPermissionStatus(account).call();
    const hex = getReturnDataHex(res);
    if (hex) {
      const decoded = this.contractInterface.decodeFunctionResult('getPermissionStatus', hex) as unknown as [
        boolean,
        boolean,
        boolean,
        boolean,
        boolean,
        boolean,
        boolean,
        bigint,
        boolean,
      ];
      return {
        frozen: decoded[0],
        blacklisted: decoded[1],
        whitelisted: decoded[2],
        sendBlocked: decoded[3],
        receiveBlocked: decoded[4],
        mintRole: decoded[5],
        burnRole: decoded[6],
        userLimit: String(decoded[7]),
        paused: decoded[8],
      };
    }
    return res as Btip26PermissionStatusResult;
  }

  async getAddressesWithPermission(permission: string): Promise<string[]> {
    const res = await this.contract.methods.getAddressesWithPermissionByName(permission).call();
    const hex = getReturnDataHex(res);
    if (hex) {
      const decoded = this.contractInterface.decodeFunctionResult('getAddressesWithPermissionByName', hex) as unknown;
      return Array.isArray(decoded) ? (decoded[0] as string[]) : [];
    }
    return Array.isArray(res) ? (res as string[]) : [];
  }

  private async executeMethod(from: BeatozTxSigner, methodName: string, args: unknown[], gas: number): Promise<BeatozTxResult> {
    const methodAbi = await (this.contract.methods as any)[methodName](...args).encodeABI();
    const signedTx = await this.buildSignedTransaction(from, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? `${methodName} failed`);
    }
    return txResult;
  }

  private toTransferResult(txResult: BeatozTxResult, methodName: string): Btip26TransferResult {
    const correlationId = this.findCorrelationIdFromEvents(txResult) ?? this.findCorrelationIdFromReturnData(txResult, methodName);
    if (!correlationId) {
      throw new Error(`${methodName} did not emit or return a correlationId`);
    }
    return {
      txResult,
      txHash: txResult.txHash,
      correlationId,
    };
  }

  private findCorrelationIdFromEvents(txResult: BeatozTxResult): string | null {
    const eventNames = ['TransferLogAttrs', 'BPrNTransferRequested'] as const;
    const topicHashes = eventNames
      .map((eventName) => this.contractInterface.getEvent(eventName)?.topicHash?.toLowerCase())
      .filter((topicHash): topicHash is string => Boolean(topicHash));

    for (const event of txResult.events) {
      if ((event as any)?.type !== 'evm') continue;
      const attrs: Record<string, string> = {};
      for (const attr of ((event as any).attributes ?? []) as Array<{ key: string; value: string }>) {
        const key = Buffer.from(attr.key, 'base64').toString('ascii');
        attrs[key] = decodeEventAttributeValue(attr.value);
      }

      const topic0 = attrs['topic.0'] ? with0xPrefix(attrs['topic.0']).toLowerCase() : null;
      if (!topic0 || !topicHashes.includes(topic0)) continue;

      const correlationId = attrs['topic.1'];
      if (!correlationId) continue;
      return bytes32Arg(correlationId).toLowerCase();
    }
    return null;
  }

  private findCorrelationIdFromReturnData(txResult: BeatozTxResult, methodName: string): string | null {
    if (!txResult.returnData) return null;
    try {
      const decoded = this.contractInterface.decodeFunctionResult(methodName, with0xPrefix(txResult.returnData)) as unknown as [string];
      return typeof decoded[0] === 'string' ? bytes32Arg(decoded[0]).toLowerCase() : null;
    } catch {
      return null;
    }
  }

  private async readAddress(methodName: string): Promise<string> {
    const result = await this.contract.methods[methodName]().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertAddress(toConverterShape(hex)) : String(result ?? '');
  }

  private async readString(methodName: string): Promise<string> {
    const result = await this.contract.methods[methodName]().call();
    const hex = getReturnDataHex(result);
    return hex ? this.converter.convertString(toConverterShape(hex)) : String(result ?? '');
  }

  private async readBytes32(methodName: string): Promise<string> {
    const result = await this.contract.methods[methodName]().call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bytes32', hex);
      return typeof decoded === 'string' ? decoded : String(decoded);
    }
    return String(result ?? '');
  }

  private async readBool(methodName: string): Promise<boolean> {
    const result = await this.contract.methods[methodName]().call();
    const hex = getReturnDataHex(result);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bool', hex);
      return decoded === true || decoded === 'true' || decoded === '1' || decoded === BigInt(1);
    }
    return result === true || result === 'true' || result === '1';
  }
}
