/** @format */
import { Provider } from "./provider"
import {BeatozNetworkType} from "./constant";
import {BeatozChainFactory} from "./beatoz-chain-factory";

async function main() {
	//const configDirPath = "/Users/utopia/github/ryanpark-beatoz/crypto-issuer-platform-backend/config"
	const configDirPath = "/home/ryan/github.com/beatoz/crypto-issuer-platform-backend/config"
	const network = "devnet"

	const btzFacedeFactory2 = new BeatozChainFactory("./config")

	// 1
	const p1 = await createBeatozProvider(configDirPath, network)

	// 2
	await new BeatozChainFactory(configDirPath).createBeatozProvider(network)

	// 3
	const btzFacedeFactory = new BeatozChainFactory(configDirPath)
	const btzFacade = await btzFacedeFactory.createBtzFacade(network)
	const jsonReader = btzFacedeFactory.createContractJsonReader()
	new Provider(btzFacade, jsonReader)
}

main().catch((error) => {
	console.error("Error:", error)
	process.exit(1)
})

export async function createBeatozProvider(configFilePath: string, beatozNetworkType: BeatozNetworkType) {
  return new BeatozChainFactory(configFilePath).createBeatozProvider(beatozNetworkType)
}
