export class ContractJson {
  constructor(readonly contractJson: any) {
    if (contractJson.abi === undefined || contractJson.abi.length === 0) {
      throw new Error('Invalid abi');
    }
    if (contractJson.bytecode === undefined || contractJson.bytecode.length === 0) {
      throw new Error('Invalid bytecode');
    }
  }

  static FromJsonString(jsoncContents: string) {
    return new ContractJson(JSON.parse(jsoncContents));
  }

  abi() {
    return this.contractJson.abi;
  }

  bytecode() {
    return this.contractJson.bytecode;
  }
}
