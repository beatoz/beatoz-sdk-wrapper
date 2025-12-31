/** @format */
import { Event } from "@beatoz/web3-types/lib/commonjs/responses"
import { Interface } from "ethers"

type Constructor<T> = new (...args: any[]) => T

export class BeatozEvmEventService {
	constructor(
		readonly contractInterface: Interface,
		readonly contractAddress: string
	) {}

	add0x = (h: string) => (h.startsWith("0x") ? h : "0x" + h)

	createEventInstance<T>(classType: Constructor<T>, args: string[]) {
		return new classType(...args)
	}

  getEvents2<T>(events: readonly Event[], eventSigHash: string, evmEventType: Constructor<T>) {
    for (const event of events) {
      const parsedEvmEvent = this.parseEvmEvent(event)
      if (parsedEvmEvent == null) continue

      if (this.contractAddress.toLowerCase() != this.add0x(parsedEvmEvent.attributes.contractAddress.toLowerCase())) {
        //continue
      }

      // const eventFragment = this.contractInterface.getEvent(evmEventType.name)
      // if (eventFragment == null) continue
      // eventFragment.topicHash

      for (const topic of parsedEvmEvent.attributes.topics) {
        if (eventSigHash !== this.add0x(topic.toLowerCase())) {
          continue
        }

        const eventFragment = this.contractInterface.getEvent(this.add0x(topic))
        if (eventFragment == null) continue

        if (eventFragment.name == evmEventType.name) {
          const topics: ReadonlyArray<string> = parsedEvmEvent.attributes.topics.map((t: string) => this.add0x(t))
          const eventArgs = this.contractInterface.decodeEventLog(eventFragment, this.add0x(parsedEvmEvent.attributes.data), topics)
          return this.createEventInstance(evmEventType, eventArgs)
        }
      }
    }
  }

	getEvents<T>(events: readonly Event[], evmEventType: Constructor<T>) {
		for (const event of events) {
			const parsedEvmEvent = this.parseEvmEvent(event)
			if (parsedEvmEvent == null) continue

			if (this.contractAddress.toLowerCase() != this.add0x(parsedEvmEvent.attributes.contractAddress.toLowerCase())) {
				//continue
			}

          // const eventFragment = this.contractInterface.getEvent(evmEventType.name)
          // if (eventFragment == null) continue
          // eventFragment.topicHash

			for (const topic of parsedEvmEvent.attributes.topics) {
				const eventFragment = this.contractInterface.getEvent(this.add0x(topic))
				if (eventFragment == null) continue

				if (eventFragment.name == evmEventType.name) {
					const eventArgs = this.contractInterface.decodeEventLog(eventFragment, this.add0x(parsedEvmEvent.attributes.data))
					return this.createEventInstance(evmEventType, eventArgs)
				}
			}
		}
	}

	parseEvmEvent(srcEvt: any): any {
		if (srcEvt.type !== "evm") {
			return null
		}

		const evt: Record<string, any> = {}
		evt["type"] = srcEvt.type

		const attrs: Record<string, any> = {}
		if (evt["type"] === "evm") {
			attrs["topics"] = []
		}

		for (let i = 0; i < srcEvt.attributes.length; i++) {
			const attr = srcEvt.attributes[i]

			const _key: string = Buffer.from(attr.key, "base64").toString("ascii")
			let _value: any = Buffer.from(attr.value, "base64")

			if (this.isPrintable(_value)) {
				_value = _value.toString("ascii")
			} else {
				_value = "0x" + _value.toString("hex")
			}

			if (_key.startsWith("topic.")) {
				attrs["topics"].push(_value)
			} else {
				attrs[`${_key}`] = _value
			}
		}

		evt["attributes"] = attrs
		return evt
	}

	isPrintable(val: Buffer): boolean {
		for (let i = 0; i < val.length; i++) {
			return val[i] >= 33 && val[i] < 126
		}
		return false
	}
}