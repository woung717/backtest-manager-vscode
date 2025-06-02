// src/services/backtestService.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { BacktraderConfig } from '../engines/backtrader/types'; 
import { BacktestResult as EngineBacktestResult } from '../engines/common/types'; 
import { VectorBTConfig } from '../engines/vectorbt/types'; 
import { IPythonEnvironmentService } from './pythonEnvironmentService';
import { IProjectService } from './projectService'; 
import { BacktraderRunner } from '../engines/backtrader/backtraderRunner';
import { VectorBTRunner } from '../engines/vectorbt/vectorbtRunner';
import { CustomEngineConfig } from '../engines/custom/types';
import { CustomEngineRunner } from '../engines/custom/customEngineRunner';

export type BacktestRunConfig = BacktraderConfig | VectorBTConfig;

export interface IBacktestService {
  runBacktest(
    projectId: string, 
    backtestConfig: BacktestRunConfig,
    progressCallback?: (progress: number, message?: string) => void
  ): Promise<EngineBacktestResult>; 
  getProjectStrategyClass(strategyCode: string): Promise<string | undefined>;
}

export class BacktestService implements IBacktestService {

  constructor(
    private pythonEnvService: IPythonEnvironmentService,
    private projectService: IProjectService,
    private readonly backtraderStrategyClassPattern = /class\s+(\w+)\s*\([^.]+\.Strategy\):/
  ) {}

  private async readStrategyCode(strategyFilePath: string): Promise<string> {
    try {
      return await fs.readFile(strategyFilePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading strategy code from ${strategyFilePath}:`, error);
      throw new Error(`Failed to read strategy code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async runBacktest(
    projectId: string,
    backtestConfig: BacktestRunConfig,
    progressCallback?: (progress: number, message?: string) => void
  ): Promise<EngineBacktestResult> {
    if (progressCallback) {
      progressCallback(0, 'Starting backtest...');
    }

    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found.`);
    }

    if (progressCallback) {
      progressCallback(10, 'Fetching Python path...');
    }
    
    const pythonPath = await this.pythonEnvService.getPythonPath();
    if (!pythonPath) {
      throw new Error('Python path not found. Please ensure the Python extension is configured correctly.');
    }

    const strategyFilePath = path.join(project.path, project.entryFile);
    if (progressCallback) {
      progressCallback(20, `Reading strategy code from ${strategyFilePath}...`);
    }
    const strategyCode = await this.readStrategyCode(strategyFilePath);

    let engineRunner;

    if (progressCallback) {
      progressCallback(30, `Initializing ${project.engine} engine...`);
    }

    if (project.engine === 'backtrader') {
      const libName = 'backtrader';
      if (progressCallback) {
        progressCallback(35, `Checking if ${libName} library is installed...`);
      }
      const isLibInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, libName);
      if (!isLibInstalled) {
        throw new Error(`${libName} library is not installed. Please install it in your Python environment.`);
      }

      const strategyClassName = await this.getProjectStrategyClass(strategyCode);
      if (!strategyClassName) {
        throw new Error('Strategy class name not defined in project settings for Backtrader.');
      }

      const fullConfig = {
        ...backtestConfig,
        pythonPath: pythonPath,
        strategy: strategyClassName,
        logLevel: 'debug',
      } as BacktraderConfig;

      engineRunner = new BacktraderRunner(project, fullConfig);
    } else if (project.engine === 'vectorbt') {
      const libName = 'vectorbt'; 
      if (progressCallback) {
        progressCallback(35, `Checking if ${libName} library is installed...`);
      }

      const isLibInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, libName);
      if (!isLibInstalled) {
        throw new Error(`${libName} library is not installed. Please install it in your Python environment.`);
      }
      
      const fullConfig = {
        ...backtestConfig, 
        pythonPath: pythonPath,
        logLevel: 'debug', 
      } as VectorBTConfig;
      engineRunner = new VectorBTRunner(project, fullConfig);
    } else if (project.engine === 'custom') {
      const fullConfig = {
        ...backtestConfig, 
        pythonPath: pythonPath,
        logLevel: 'debug',
      } as CustomEngineConfig;
      engineRunner = new CustomEngineRunner(project, fullConfig); // Assuming CustomEngineRunner is defined
    } else {
      throw new Error(`Unsupported backtest engine: ${project.engine}`);
    }

    if (progressCallback) { 
      progressCallback(50, 'Running backtest via engine runner...'); 
    }
    
    try {
      const result = await engineRunner.runBacktest(strategyCode); // Assuming runners have runBacktest
      if (progressCallback) {
        progressCallback(100, 'Backtest completed.');
      }
      
      return result;
    } catch (error) {
      console.error('Backtesting failed:', error);
      if (progressCallback) {
        progressCallback(100, `Backtest failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      throw new Error(`Backtesting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getProjectStrategyClass(strategyCode: string): Promise<string | undefined> {
    const backtraderStrategyClassPattern = /class\s+(\w+)\s*\((?:bt\.|backtrader\.)?Strategy\):/gm; 
    
    let match;
    let lastMatch: string | undefined;
    while ((match = backtraderStrategyClassPattern.exec(strategyCode)) !== null) {
        lastMatch = match[1];
    }
    
    if (lastMatch) {
        console.log(`Strategy class found: ${lastMatch}`);
        return lastMatch;
    } else {
        console.log(`No Backtrader strategy class found with pattern ${backtraderStrategyClassPattern}`);
        return undefined;
    }
  }
}
