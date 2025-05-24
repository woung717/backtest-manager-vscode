// src/services/backtestService.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
    ProjectInfo, 
    ValidationResult, 
    Engine // Assuming Engine type is in global types
} from '../types';
import { 
    BacktraderConfig, 
    BacktestResult as EngineBacktestResult // Renaming to avoid conflict if BacktestResult is also in global types
} from '../engines/backtrader/types'; // Specific to backtrader
import { VectorBTConfig } from '../engines/vectorbt/types'; // Specific to vectorbt
import { IPythonEnvironmentService } from './pythonEnvironmentService';
import { IProjectService } from './projectService'; // To fetch project details
import { BacktraderRunner } from '../engines/backtrader/backtraderRunner';
import { VectorBTRunner } from '../engines/vectorbt/vectorbtRunner';

// Define a union type for possible config types if not already globally defined
export type BacktestRunConfig = BacktraderConfig | VectorBTConfig;

export interface IBacktestService {
  runBacktest(
    projectId: string, 
    backtestConfig: BacktestRunConfig, // Use the union type
    progressCallback?: (progress: number, message?: string) => void
  ): Promise<EngineBacktestResult>; // Runner returns EngineBacktestResult
  
  validateConfig(config: BacktestRunConfig): Promise<ValidationResult>;
}

export class BacktestService implements IBacktestService {

  constructor(
    private pythonEnvService: IPythonEnvironmentService,
    private projectService: IProjectService 
  ) {}

  private async readStrategyCode(strategyFilePath: string): Promise<string> {
    try {
      return await fs.readFile(strategyFilePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading strategy code from ${strategyFilePath}:`, error);
      throw new Error(`Failed to read strategy code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateConfig(config: BacktestRunConfig): Promise<ValidationResult> {
    console.log('BacktestService.validateConfig called with config:', config);
    const errors: string[] = [];
    let isValid = true;

    if (!config || typeof config !== 'object') {
      errors.push('Config is missing or not an object.');
      isValid = false;
    } else {
        // Common validation for BacktraderConfig and VectorBTConfig structure
        if ('broker' in config && typeof (config as BacktraderConfig).broker !== 'object') {
            errors.push('Broker configuration is missing or not an object for Backtrader.');
            isValid = false;
        } else if ('broker' in config && (typeof (config as BacktraderConfig).broker.initialCapital !== 'number' || (config as BacktraderConfig).broker.initialCapital <= 0)) {
            errors.push('Initial capital in broker configuration must be a positive number for Backtrader.');
            isValid = false;
        }

        // VectorBT specific validation (example, adjust as needed)
        if ('functionType' in config && !(config as VectorBTConfig).settings[(config as VectorBTConfig).functionType]) {
            errors.push(`Settings for functionType "${(config as VectorBTConfig).functionType}" are missing for VectorBT.`);
            isValid = false;
        }
        
        if (config.env !== undefined && typeof config.env !== 'object') {
            errors.push('Environment configuration (env) must be an object if provided.');
            isValid = false;
        }
        // Add more specific checks for BacktraderConfig or VectorBTConfig fields as needed
    }
    
    return Promise.resolve({ isValid, errors });
  }

  async runBacktest(
    projectId: string,
    backtestConfig: BacktestRunConfig,
    progressCallback?: (progress: number, message?: string) => void
  ): Promise<EngineBacktestResult> {
    if (progressCallback) progressCallback(0, 'Starting backtest...');

    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found.`);
    }

    if (progressCallback) progressCallback(10, 'Fetching Python path...');
    const pythonPath = await this.pythonEnvService.getPythonPath();
    if (!pythonPath) {
      throw new Error('Python path not found. Please ensure the Python extension is configured correctly.');
    }

    const strategyFilePath = path.join(project.path, project.entryFile);
    if (progressCallback) progressCallback(20, `Reading strategy code from ${strategyFilePath}...`);
    const strategyCode = await this.readStrategyCode(strategyFilePath);

    let engineRunner;
    let fullConfig; // This will hold the specific config type (BacktraderConfig or VectorBTConfig)

    if (progressCallback) progressCallback(30, `Initializing ${project.engine} engine...`);

    if (project.engine === 'backtrader') {
      const libName = 'backtrader';
      if (progressCallback) progressCallback(35, `Checking if ${libName} library is installed...`);
      const isLibInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, libName);
      if (!isLibInstalled) {
        // Consider attempting to install: await this.pythonEnvService.installLibrary(pythonPath, libName);
        // For now, throw error
        throw new Error(`${libName} library is not installed. Please install it in your Python environment.`);
      }
      if (!project.strategy) {
        throw new Error('Strategy class name not defined in project settings for Backtrader.');
      }
      fullConfig = {
        ...(backtestConfig as BacktraderConfig), // Cast to specific type
        pythonPath: pythonPath,
        strategy: project.strategy, // Ensure project.strategy is available and correct
        logLevel: 'debug', // Example, make this configurable
      } as BacktraderConfig;
      engineRunner = new BacktraderRunner(project, fullConfig);
    } else if (project.engine === 'vectorbt') {
      const libName = 'vectorbt'; // or 'vectorbtpro'
      if (progressCallback) progressCallback(35, `Checking if ${libName} library is installed...`);
      const isLibInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, libName);
      if (!isLibInstalled) {
        // As above, consider installation or throw.
        throw new Error(`${libName} library is not installed. Please install it in your Python environment.`);
      }
       if (!project.strategy) { // vectorbt might not always need a class name if using functional approach
        console.warn('Strategy identifier not defined in project settings for VectorBT. Assuming functional approach from entry file.');
      }
      fullConfig = {
        ...(backtestConfig as VectorBTConfig), // Cast to specific type
        pythonPath: pythonPath,
        strategy: project.strategy || '', // VectorBT might not use a class name from project.strategy
        logLevel: 'debug', // Example
      } as VectorBTConfig;
      engineRunner = new VectorBTRunner(project, fullConfig);
    } else {
      throw new Error(`Unsupported backtest engine: ${project.engine}`);
    }

    if (progressCallback) progressCallback(50, 'Running backtest via engine runner...');
    
    try {
      const result = await engineRunner.runBacktest(strategyCode); // Assuming runners have runBacktest
      if (progressCallback) progressCallback(100, 'Backtest completed.');
      return result;
    } catch (error) {
      console.error('Backtesting failed:', error);
      if (progressCallback) progressCallback(100, `Backtest failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Backtesting failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
