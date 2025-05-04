import * as vscode from 'vscode';
import { BacktestConfig, BacktestResult } from './backtrader/impl/types';
import { ProjectInfo } from './types';
import { BacktraderRunner } from './backtrader/impl/backtraderRunner';
import * as path from 'path';

export class Backtest {
    private config: BacktestConfig;
    private project: ProjectInfo;

    constructor(config: BacktestConfig, project: ProjectInfo) {
        this.config = config;
        this.project = project;
    }

    public static validateConfig(config: any): boolean {
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        if (!config.broker || typeof config.broker !== 'object') {
            return false;
        }

        if (typeof config.broker.initialCapital !== 'number' || config.broker.initialCapital <= 0) {
            return false;
        }
        
        if (config.env !== undefined && typeof config.env !== 'object') {
            return false;
        }
        
        return true;
    }

    private async getPythonPath(): Promise<string | undefined> {
        const pythonExtension = vscode.extensions.getExtension('ms-python.python');
        if (!pythonExtension) {
            vscode.window.showErrorMessage('Python extension is not installed.');
            return undefined;
        }

        const pythonPath = await pythonExtension.exports.settings.getExecutionDetails().execCommand[0];
        if (!pythonPath) {
            vscode.window.showErrorMessage('Python interpreter not found. Please select an interpreter in the Python extension.');
            return undefined;
        }

        return pythonPath;
    }

    private async readStrategyCode(): Promise<string> {
        try {
            const filePath = path.join(this.project.path, this.project.entryFile);
            const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            return Buffer.from(fileContent).toString('utf8');
        } catch (error) {
            throw new Error(`Could not read strategy code: ${error}`);
        }
    }

    public async run(): Promise<BacktestResult> {
        const pythonPath = await this.getPythonPath();
        
        if (!pythonPath) {
            throw new Error('Python path not found.');
        }

        const backtestConfig = {
            ...this.config,
            pythonPath: pythonPath,
            strategy: this.project.strategy!,
            plotEnabled: true,
            logLevel: 'debug' as 'debug',
        };
        const runner = new BacktraderRunner(this.project, backtestConfig);
        const strategyCode = await this.readStrategyCode();

        return await runner.runBacktest(strategyCode);
    }
} 