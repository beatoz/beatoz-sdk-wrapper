import { LinkerChannelClient, LinkerEndpointClient, TokenBTIP10Client } from '../../contract-client';
import { BeatozAccount } from '../beatoz-account';
import { BeatozProvider } from '../beatoz-provider';

export class BpunPrepareLinkerProtocol {
  constructor(
    private readonly beatozProvider: BeatozProvider,
    private readonly linkerEndpoint: LinkerEndpointClient
  ) {}

  async prepareLinkerProtocol(
    newBtipToken: TokenBTIP10Client,
    tokenOwnerAccount: BeatozAccount,
    targetChainId: string,
    targetBtip10TokenAddress: string
  ) {
    await newBtipToken.setLinkerEndpoint(tokenOwnerAccount, this.linkerEndpoint.contractAddress);
    await this.addDAppChannel(newBtipToken, tokenOwnerAccount, targetChainId, targetBtip10TokenAddress);
  }

  async addDAppChannel(
      btip10Token: TokenBTIP10Client,
      tokenOwner: BeatozAccount,
      targetChainId: string,
      targetBtip10TokenAddress: string
  ) {
    const linkerChannelAddress = await btip10Token.linkerChannel();
    const linkerChannelClient = LinkerChannelClient.create(
        this.beatozProvider.beatozChain,
        this.beatozProvider.contractJsonReader,
        linkerChannelAddress
    );

    await linkerChannelClient.addDAppChannel(tokenOwner, targetChainId, targetBtip10TokenAddress);
  }
}
