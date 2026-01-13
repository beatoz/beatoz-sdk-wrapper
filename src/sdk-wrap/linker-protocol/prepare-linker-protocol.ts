import {LinkerChannelClient, LinkerEndpointClient, TokenBTIP10Client} from "../../contract-client";
import {BeatozAccount} from "../beatoz-account";
import {Provider} from "../provider";

export class BpunPrepareLinkerProtocol {
  constructor(
      private readonly beatozProvider: Provider,
      private readonly linkerEndpoint: LinkerEndpointClient
  ) {}

  async prepareLinkerProtocol(
      newBtipToken: TokenBTIP10Client,
      tokenOwnerAccount: BeatozAccount,
      targetChainId: string,
      targetBtip10TokenAddress: string
  ) {
    await newBtipToken.setLinkerEndpoint(tokenOwnerAccount, this.linkerEndpoint.contractAddress)

    const linkerChannelAddress = await newBtipToken.linkerChannel()
    const linkerChannelClient = LinkerChannelClient.create(
        this.beatozProvider.btzChain,
        this.beatozProvider.contractJsonReader,
        linkerChannelAddress
    )

    await linkerChannelClient.addDAppChannel(tokenOwnerAccount, targetChainId, targetBtip10TokenAddress)
  }
}
