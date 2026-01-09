import { TrxProtoBuilder } from '@beatoz/web3-accounts';
import { BeatozAccount } from '../beatoz-account';
import { BeatozBaseTx } from './beatoz-base-tx';

export class BeatozContractTx extends BeatozBaseTx {
  async buildContractTransaction(from: BeatozAccount, to: string, amount: string, methodAbi: string, gas: number) {
    return TrxProtoBuilder.buildContractTrxProto({
      from: from.address,
      to: to,
      nonce: await from.nonce(),
      amount: amount,
      payload: { data: methodAbi },
      //gas: Number(rule.value.maxTrxGas),
      gas: gas,
      gasPrice: await this.beatozChain.getGasPrice(),
      //type: 6,
    });
  }
}
