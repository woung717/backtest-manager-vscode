import * as vscode from 'vscode';
import { BacktestConfig, BacktestResult } from './backtrader/impl/types';
import { ProjectInfo } from './types';
import { BacktraderRunner } from './backtrader/impl/backtraderRunner';
import { VectorBTRunner } from './vectorbt/impl/vectorbtRunner';
import { VectorBTConfig } from './vectorbt/impl/types';
import * as path from 'path';

export class Backtest {
    private backtestConfig: BacktestConfig | VectorBTConfig;
    private project: ProjectInfo;

    constructor(config: BacktestConfig | VectorBTConfig, project: ProjectInfo) {
        this.backtestConfig = config;
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
            vscode.window.showErrorMessage('Python 확장이 설치되어 있지 않습니다.');
            return undefined;
        }

        const pythonPath = await pythonExtension.exports.settings.getExecutionDetails().execCommand[0];
        if (!pythonPath) {
            vscode.window.showErrorMessage('Python 인터프리터를 찾을 수 없습니다. Python 확장에서 인터프리터를 선택해 주세요.');
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
            throw new Error(`전략 코드를 읽을 수 없습니다: ${error}`);
        }
    }

    public async run(): Promise<BacktestResult> {
        const pythonPath = await this.getPythonPath();
        
        if (!pythonPath) {
            throw new Error('Python 경로를 찾을 수 없습니다.');
        }

        const strategyCode = await this.readStrategyCode();

        // 프로젝트의 엔진에 따라 다른 러너 사용
        if (this.project.engine === 'backtrader') {
            const backtestConfig = {
                ...this.backtestConfig as BacktestConfig,
                pythonPath: pythonPath,
                strategy: this.project.strategy!,
                plotEnabled: true,
                logLevel: 'debug' as 'debug',
            };
            const runner = new BacktraderRunner(this.project, backtestConfig);
            return await runner.runBacktest(strategyCode);
        } else if (this.project.engine === 'vectorbt') {
            const vectorbtConfig = {
                ...this.backtestConfig as VectorBTConfig,
                pythonPath: pythonPath,
                strategy: this.project.strategy!,
                plotEnabled: true,
                logLevel: 'debug' as 'debug',
            };
            const runner = new VectorBTRunner(this.project, vectorbtConfig);
            return await runner.runBacktest(strategyCode);
        } else {
            throw new Error(`지원되지 않는 백테스트 엔진: ${this.project.engine}`);
        }
    }
} 