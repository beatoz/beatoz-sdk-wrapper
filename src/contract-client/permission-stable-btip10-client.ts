/** @format */

import {
  BeatozAccount,
  BeatozChain,
  ContractJsonReader,
  BeatozContractDeployer,
  DEFAULT_GAS,
} from '../sdk-wrap';
import { Address } from '@beatoz/web3';
import { TokenBtip10Core } from './token-btip10-core';

export interface PermissionStatusResult {
  frozen: boolean;
  blacklisted: boolean;
  whitelisted: boolean;
  canSend: boolean;
  canReceive: boolean;
  mintRole: boolean;
  burnRole: boolean;
  userLimit: string;
  paused: boolean;
}

const PERMISSION_TO_ENUM: Record<string, number> = {
  canSend: 0,
  canReceive: 1,
  mintRole: 2,
  burnRole: 3,
  whitelist: 4,
  frozen: 5,
  blacklist: 6,
};

/** Beatoz view call may return raw { value: { returnData: hex } }; extract hex for decode or build shape for converter */
function getReturnDataHex(response: any): string | null {
  if (response == null || typeof response !== 'object') return null;
  const data = response.value?.returnData ?? response.returnData;
  if (typeof data !== 'string' || !data) return null;
  return data.startsWith('0x') ? data : `0x${data}`;
}

function toConverterShape(hex: string): { value: { returnData: string } } {
  return { value: { returnData: hex } };
}

export class PermissionStableBTIP10Client extends TokenBtip10Core {
  static CONTRACT_NAME = 'PermissionStableBTIP10';

  static async deploy(
    contractDeployer: BeatozContractDeployer,
    deployAccount: BeatozAccount,
    tokenName: string,
    tokenSymbol: string,
    owner: string,
    gas: number = DEFAULT_GAS
  ): Promise<string> {
    const contractAddress = await contractDeployer.deploy(
      this.CONTRACT_NAME,
      deployAccount,
      [tokenName, tokenSymbol, owner],
      gas
    );
    return contractAddress;
  }

  static create(
    btzWeb3: BeatozChain,
    contractJsonReader: ContractJsonReader,
    contractAddress: string,
    linkerEndpointContractName: string
  ): PermissionStableBTIP10Client {
    const contractJson = contractJsonReader.readContractJson(this.CONTRACT_NAME);
    const linkerEndpointContractJson = contractJsonReader.readContractJson(linkerEndpointContractName);
    return new PermissionStableBTIP10Client(
      btzWeb3,
      contractAddress,
      contractJson,
      linkerEndpointContractJson
    );
  }

  constructor(
    btzWeb3: BeatozChain,
    contractAddress: string,
    contractJson: any,
    linkerEndpointContractJson: any
  ) {
    super(btzWeb3, contractAddress, contractJson, linkerEndpointContractJson);
  }

  async mint(from: BeatozAccount, to: Address, mintAmount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.mint(to, mintAmount).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async burn(from: BeatozAccount, burnAmount: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.burn(burnAmount).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setLinkerEndpoint(ownerAccount: BeatozAccount, endpointAddress: string, gas: number = 3500000) {
    const methodAbi = await this.contract.methods.setLinkerEndpoint(endpointAddress).encodeABI();
    const signedTx = await this.buildSignedTransaction(
      ownerAccount,
      this.contractAddress,
      '0',
      methodAbi,
      gas
    );
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? 'setLinkerEndpoint failed');
    }
    return txResult;
  }

  /** Owner: grant/revoke permissions */
  async setCanSend(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setCanSend(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setCanReceive(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setCanReceive(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setMintRole(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setMintRole(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setBurnRole(from: BeatozAccount, account: string, granted: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setBurnRole(account, granted).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async freeze(from: BeatozAccount, account: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.freeze(account).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async unfreeze(from: BeatozAccount, account: string, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.unfreeze(account).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async setPaused(from: BeatozAccount, paused: boolean, gas: number = DEFAULT_GAS) {
    const methodAbi = await this.contract.methods.setPaused(paused).encodeABI();
    return this.executeTransaction(from, methodAbi, gas);
  }

  async getOwner(): Promise<string> {
    const res = await this.contract.methods.owner().call();
    const hex = getReturnDataHex(res);
    if (hex) return this.converter.convertAddress(toConverterShape(hex));
    return typeof res === 'string' ? res : String(res ?? '');
  }

  async isPaused(): Promise<boolean> {
    const res = await this.contract.methods.isPaused().call();
    const hex = getReturnDataHex(res);
    if (hex) {
      const decoded = this.beatozChain.web3.beatoz.abi.decodeParameter('bool', hex);
      if (typeof decoded === 'boolean') return decoded;
      if (typeof decoded === 'bigint') return decoded !== BigInt(0);
      return Boolean(decoded);
    }
    return Boolean(res);
  }

  async getPermissionStatus(account: string): Promise<PermissionStatusResult> {
    const res = await this.contract.methods.getPermissionStatus(account).call();
    const hex = getReturnDataHex(res);
    if (hex) {
      const fragment = this.contractInterface.getFunction('getPermissionStatus');
      if (!fragment) return res as PermissionStatusResult;
      const decoded = this.contractInterface.decodeFunctionResult(fragment, hex) as unknown as
        [boolean, boolean, boolean, boolean, boolean, boolean, boolean, bigint, boolean];
      if (Array.isArray(decoded) && decoded.length >= 9) {
        return {
          frozen: decoded[0],
          blacklisted: decoded[1],
          whitelisted: decoded[2],
          canSend: decoded[3],
          canReceive: decoded[4],
          mintRole: decoded[5],
          burnRole: decoded[6],
          userLimit: String(decoded[7]),
          paused: decoded[8],
        };
      }
    }
    return res as PermissionStatusResult;
  }

  async getAddressesWithPermission(permission: string): Promise<string[]> {
    const key = permission.toLowerCase();
    const enumVal = key in PERMISSION_TO_ENUM ? PERMISSION_TO_ENUM[key] : 0;
    const res = await this.contract.methods.getAddressesWithPermission(enumVal).call();
    const hex = getReturnDataHex(res);
    if (hex) {
      const fragment = this.contractInterface.getFunction('getAddressesWithPermission');
      if (!fragment) return Array.isArray(res) ? (res as string[]) : [];
      const decoded = this.contractInterface.decodeFunctionResult(fragment, hex) as unknown;
      if (Array.isArray(decoded)) return decoded as string[];
    }
    return Array.isArray(res) ? (res as string[]) : [];
  }

  private async executeTransaction(from: BeatozAccount, methodAbi: string, gas: number) {
    const signedTx = await this.buildSignedTransaction(from, this.contractAddress, '0', methodAbi, gas);
    const txResult = await this.sendSignedTransaction(signedTx);
    if (txResult.isFailed) {
      throw new Error(txResult.errorInfo?.toString() ?? 'Transaction failed');
    }
    return txResult;
  }
}
