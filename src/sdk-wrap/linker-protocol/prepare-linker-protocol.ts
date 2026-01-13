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

    const linkerChannelAddress = await newBtipToken.linkerChannel();
    const linkerChannelClient = LinkerChannelClient.create(
      this.beatozProvider.beatozChain,
      this.beatozProvider.contractJsonReader,
      linkerChannelAddress
    );

    await linkerChannelClient.addDAppChannel(tokenOwnerAccount, targetChainId, targetBtip10TokenAddress);
  }
}
