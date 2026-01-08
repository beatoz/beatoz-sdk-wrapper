import {BeatozChain} from "./beatoz-chain";

export class BeatozAddress {
  readonly btz: BeatozChain
  readonly address: string

  constructor(web3: BeatozChain, address: string) {
    this.btz = web3
    this.address = address
  }

  async nonce() {
    const accountResponse = await this.btz.getAccount(this.address)
    return accountResponse.value.nonce
  }

  async balance() {
    const accountResponse = await this.btz.getAccount(this.address)
    return accountResponse.value.balance
  }
}

export class BeatozAddressService {
  constructor(readonly beatozChain: BeatozChain) {
  }

  async nonce(address: string) {
    const accountResponse = await this.beatozChain.getAccount(address)
    return accountResponse.value.nonce
  }

  async balance(address: string) {
    const accountResponse = await this.beatozChain.getAccount(address)
    return accountResponse.value.balance
  }
}
