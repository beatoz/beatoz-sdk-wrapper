/** @format */

import path from 'node:path';
import fs from 'fs';
import { ContractJson } from './contract-json';

export class ContractJsonReader {
  private readonly baseDir: string;
  private readonly dirPaths: string[] = ['artifacts', 'contracts'];

  constructor(baseDir: string) {
    // let currentPath = baseDir
    // for (const dir of this.dirPaths) {
    // 	currentPath = path.join(currentPath, dir)
    // }
    this.validateDir(baseDir);
    this.baseDir = baseDir;
  }

  static readContractJson(contractJsonFilePath: string): ContractJson {
    if (!fs.existsSync(contractJsonFilePath)) {
      throw new Error(`Contract JSON file does not exist: ${contractJsonFilePath}`);
    }
    const fileContent = fs.readFileSync(contractJsonFilePath, 'utf8');
    return ContractJson.FromJsonString(fileContent);
  }

  readContractJson(contractName: string): ContractJson {
    const contractJsonFilePath = path.join(this.baseDir, `${contractName}.sol`, `${contractName}.json`);
    return ContractJsonReader.readContractJson(contractJsonFilePath);
  }

  private validateDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Artifacts directory does not exist: ${dirPath}`);
    }
  }

  private validateDirPath() {
    const artifactsDir = path.join(this.baseDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      throw new Error(`Artifacts directory does not exist: ${artifactsDir}`);
    }

    const contractsDir = path.join(artifactsDir, 'contracts');
    if (!fs.existsSync(contractsDir)) {
      throw new Error(`Contracts directory does not exist: ${contractsDir}`);
    }
  }
}
