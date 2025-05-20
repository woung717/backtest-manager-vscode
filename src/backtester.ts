import * as vscode from 'vscode';
import { BacktraderConfig, BacktestResult } from './engines/backtrader/types';
import { ProjectInfo } from './types';
import { BacktraderRunner } from './engines/backtrader/backtraderRunner';
import { VectorBTRunner } from './engines/vectorbt/vectorbtRunner';
import { VectorBTConfig } from './engines/vectorbt/types';
import * as path from 'path';

export class Backtester {
    private backtestConfig: BacktraderConfig | VectorBTConfig;
    private project: ProjectInfo;

    constructor(config: BacktraderConfig | VectorBTConfig, project: ProjectInfo) {
        this.backtestConfig = config;
        this.project = project;
    }

    private validateConfig(config: any): boolean {
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

    public static async getPythonPath(): Promise<string | undefined> {
        const pythonExtensionName = 'ms-python.python';
        const pythonExtensionLink = 'https://marketplace.visualstudio.com/items?itemName=ms-python.python';
        const pythonDownloadLink = 'https://www.python.org/downloads/';

        const pythonExtension = vscode.extensions.getExtension(pythonExtensionName);
        if (!pythonExtension) {
            vscode.window.showErrorMessage(
                'Python 확장을 찾을 수 없습니다. 확장 프로그램 마켓플레이스에서 Python 확장을 설치해 주세요.',
                ...['설치', '닫기']
            ).then(result => {
                if (result === '설치') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(pythonExtensionLink));
                }
            });
            return undefined;
        }

        while (!pythonExtension.isActive) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const pythonPath = await pythonExtension.exports.settings.getExecutionDetails().execCommand[0];
        if (!pythonPath) {
            vscode.window.showErrorMessage(
                'Python 인터프리터를 찾을 수 없습니다. Python 3.8 이상의 버전을 설치하고 Python 확장에서 인터프리터를 선택해 주세요.',
                ...['설치', '닫기']
            ).then(result => {
                if (result === '설치') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(pythonDownloadLink));
                }
            });
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
        try {
            this.validateConfig(this.backtestConfig);
        } catch (error) {
            throw new Error(`백테스트 설정이 유효하지 않습니다: ${error}`);
        }

        const pythonPath = await Backtester.getPythonPath();
        
        if (!pythonPath) {
            throw new Error('Python 경로를 찾을 수 없습니다.');
        }

        const strategyCode = await this.readStrategyCode();

        if (this.project.engine === 'backtrader') {
            if (!this.project.strategy) {
                vscode.window.showErrorMessage('Strategy class not found. Ensure the strategy class is defined in the entry file.');

                throw new Error('Strategy class not found.');
            }

            const backtraderConfig = {
                ...this.backtestConfig as BacktraderConfig,
                pythonPath: pythonPath,
                strategy: this.project.strategy!,
                logLevel: 'debug' as 'debug',
            };
            const runner = new BacktraderRunner(this.project, backtraderConfig);

            return await runner.runBacktest(strategyCode);
        } else if (this.project.engine === 'vectorbt') {
            const vectorbtConfig = {
                ...this.backtestConfig as VectorBTConfig,
                pythonPath: pythonPath,
                strategy: this.project.strategy!,
                logLevel: 'debug' as 'debug',
            };
            const runner = new VectorBTRunner(this.project, vectorbtConfig);

            return await runner.runBacktest(strategyCode);
        } else {
            throw new Error(`지원되지 않는 백테스트 엔진: ${this.project.engine}`);
        }
    }
} 