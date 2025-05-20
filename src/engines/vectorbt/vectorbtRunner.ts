import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import * as vscode from 'vscode';
import { BacktestResult } from '../backtrader/types';
import { ProjectInfo, TradeEnterData, TradeExitData } from '../../types';
import { generateShortHash } from '../../util';
import { VSCodeOutputLogger } from '../../vscodeOutputLogger';
import { VectorBTConfig } from './types';

export class VectorBTRunner {
    private config: VectorBTConfig;
    private tempFilePath: string = '';
    private readonly templatePath: string;
    private currentProject?: ProjectInfo;
    private currentBacktest?: BacktestResult;
    private logger: VSCodeOutputLogger = VSCodeOutputLogger.getInstance("Backtest Runner");

    constructor(project: ProjectInfo, config: VectorBTConfig) {
        this.config = config;
        this.currentProject = project;
        this.templatePath = path.join(__dirname, '..', 'templates', 'vectorbt.ejs');
    }

    public loadConfig(): VectorBTConfig {
        return this.config;
    }

    public setConfig(config: VectorBTConfig): void {
        this.config = config;
    }

    public setProject(project: ProjectInfo): void {
        this.currentProject = project;
    }

    private parseTradeData(line: string): any {
        try {
            const data = JSON.parse(line.substring(line.indexOf('{')));
            if (data.ref) {
                return data;
            }
            return null;
        } catch (error) {
            this.logger.log('거래 데이터 파싱 오류: ' + error);
            return null;
        }
    }

    private parseEquityData(line: string): any {
        try {
            const data = JSON.parse(line.substring(line.indexOf('{')));
            if (data.value && data.datetime) {
                return data;
            }
            return null;
        } catch (error) {
            this.logger.log('자산 데이터 파싱 오류: ' + error);
            return null;
        }
    }

    private async updateBacktestResult(data: any, type: 'trade' | 'equity'): Promise<void> {
        if (!this.currentBacktest?.id) {
            return;
        }

        try {
            if (type === 'trade') {
                if (!this.currentBacktest.trades) this.currentBacktest.trades = {};

                if (data.ref && !data.pnl) {  // Entry
                    const enterData: TradeEnterData = {
                        ref: data.ref,
                        datetime: data.datetime,
                        price: data.price,
                        size: data.size,
                        value: data.value,
                        commission: data.commission,
                        side: data.side
                    };

                    this.currentBacktest.trades[data.ref] = {
                        enter: enterData,
                        exits: []
                    };
                } else if (data.ref && data.pnl) {  // Exit
                    if (this.currentBacktest.trades[data.ref]) {
                        const exitData: TradeExitData = {
                            ref: data.ref,
                            datetime: data.datetime,
                            price: data.price,
                            pnl: data.pnl,
                            pnlcomm: data.pnlcomm,
                            commission: data.commission,
                            hold_bars: data.hold_bars,
                            size: data.size
                        };
                        this.currentBacktest.trades[data.ref].exits.push(exitData);
                    }
                }
            } else if (type === 'equity') {
                if (!this.currentBacktest.equity) this.currentBacktest.equity = [];
                this.currentBacktest.equity.push({
                    datetime: data.datetime,
                    value: data.value
                });
            }
        } catch (error) {
            this.logger.log('백테스트 결과 업데이트 오류: ' + error);
        }
    }

    /**
     * 백테스트 성능 지표 계산
     */
    private calculatePerformanceMetrics(): void {
        if (!this.currentBacktest) return;

        // 거래 관련 지표 계산
        const tradeCount = Object.keys(this.currentBacktest.trades).length;
        if (tradeCount > 0) {
            const profitableTrades = Object.values(this.currentBacktest.trades)
                .filter(trade => trade.exits.length > 0 && trade.exits[trade.exits.length - 1].pnlcomm > 0)
                .length;
            this.currentBacktest.performance.trades = tradeCount;
            this.currentBacktest.performance.winRate = profitableTrades / tradeCount;
        }

        // 자산 관련 지표 계산
        if (this.currentBacktest.equity.length > 0) {
            const initialValue = this.currentBacktest.equity[0].value;
            const finalValue = this.currentBacktest.equity[this.currentBacktest.equity.length - 1].value;
            this.currentBacktest.performance.totalReturn = (finalValue - initialValue) / initialValue;
            
            // 최대 낙폭 계산
            let maxDrawdown = 0;
            let peak = initialValue;
            
            for (const equityPoint of this.currentBacktest.equity) {
                const currentValue = equityPoint.value;
                
                // 새로운 피크 찾기
                if (currentValue > peak) {
                    peak = currentValue;
                }
                
                // 현재 낙폭 계산
                const drawdown = (peak - currentValue) / peak;
                
                // 최대 낙폭 업데이트
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }
            
            this.currentBacktest.performance.maxDrawdown = maxDrawdown;

            // 샤프 비율 계산
            // 무위험 수익률 2% 가정
            const riskFreeRate = 0.02;
            
            // 일별 수익률 계산
            const dailyReturns: number[] = [];
            for (let i = 1; i < this.currentBacktest.equity.length; i++) {
                const prevValue = this.currentBacktest.equity[i-1].value;
                const currentValue = this.currentBacktest.equity[i].value;
                const dailyReturn = (currentValue - prevValue) / prevValue;
                dailyReturns.push(dailyReturn);
            }
            
            // 평균 수익률 계산
            const avgReturn = dailyReturns.reduce((sum, return_) => sum + return_, 0) / dailyReturns.length;
            
            // 표준편차 계산
            const variance = dailyReturns.reduce((sum, return_) => {
                const diff = return_ - avgReturn;
                return sum + (diff * diff);
            }, 0) / dailyReturns.length;
            
            const stdDev = Math.sqrt(variance);
            
            // 연간화된 샤프 비율 계산 (252 거래일 가정)
            const annualizedAvgReturn = avgReturn * 252;
            const annualizedStdDev = stdDev * Math.sqrt(252);
            const sharpeRatio = (annualizedAvgReturn - riskFreeRate) / annualizedStdDev;
            
            // NaN 방지
            this.currentBacktest.performance.sharpeRatio = isNaN(sharpeRatio) ? 0 : sharpeRatio;
        }
    }

    private async renderScript(pythonCode: string): Promise<string> {
        const template = await fs.promises.readFile(this.templatePath, 'utf8');
        return ejs.render(template, {
            project: this.currentProject,
            config: this.config,
            userCode: pythonCode
        });
    }

    private async createTempPythonFile(pythonCode: string): Promise<string> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('워크스페이스 폴더를 찾을 수 없습니다.');
        }
        
        const tempDirPath = path.join(workspaceFolder.uri.fsPath, '.temp');
        const tempDirUri = vscode.Uri.file(tempDirPath);
        
        try {
            // .temp 디렉토리 존재 여부 확인
            await vscode.workspace.fs.stat(tempDirUri);
        } catch (error) {
            // 디렉토리가 없으면 생성
            await vscode.workspace.fs.createDirectory(tempDirUri);
        }
        
        this.tempFilePath = path.join(tempDirPath, `vectorbt_${Date.now()}.py`);
        const tempFileUri = vscode.Uri.file(this.tempFilePath);
        
        const pythonScript = await this.renderScript(pythonCode);
        const contentBuffer = Buffer.from(pythonScript, 'utf8');
        
        await vscode.workspace.fs.writeFile(tempFileUri, contentBuffer);
        
        return this.tempFilePath;
    }

    public async runBacktest(pythonCode: string): Promise<BacktestResult> {
        try {
            // 출력 채널 표시
            this.logger.revealPanel();
            
            // 새 백테스트 결과 객체 생성
            this.currentBacktest = {
                id: generateShortHash(Date.now().toString()),
                date: new Date().toISOString(),
                strategy: this.config.strategy,
                performance: {
                    totalReturn: 0,
                    annualizedReturn: 0,
                    sharpeRatio: 0,
                    maxDrawdown: 0,
                    winRate: 0,
                    profitFactor: 0,
                    trades: 0
                },
                equity: [],
                trades: {}
            };

            // 백테스트 시작 메시지 출력
            this.logger.log('========================================');
            this.logger.log('[+] 백테스트 시작...');
            this.logger.log(`[+] 전략: ${this.config.strategy}`);
            this.logger.log(`[+] 프로젝트 경로: ${this.currentProject?.path}`);
            this.logger.log(`[+] 백테스트 엔진: vectorbt`);
            this.logger.log('========================================');

            return await this.run(pythonCode);
        } catch (error) {
            throw error;
        }
    }

    private async run(pythonCode: string): Promise<BacktestResult> {
        try {
            const pythonFilePath = await this.createTempPythonFile(pythonCode);
            
            return new Promise<BacktestResult>((resolve, reject) => {
                const pythonProcess = spawn(
                    this.config.pythonPath, 
                    [pythonFilePath],
                    {
                        cwd: this.currentProject?.path,
                        env: {
                            ...this.config.env
                        }
                    }
                );

                pythonProcess.stdout.on('data', async (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (line.startsWith('trade:')) {
                            const tradeData = this.parseTradeData(line);
                            if (tradeData) {
                                await this.updateBacktestResult(tradeData, 'trade');
                            }
                        } else if (line.startsWith('equity:')) {
                            const equityData = this.parseEquityData(line);
                            if (equityData) {
                                await this.updateBacktestResult(equityData, 'equity');
                            }
                        }
                    }
                    
                    if (this.config.logLevel === 'debug') {
                        this.logger.log(data.toString());
                    }
                });

                pythonProcess.stderr.on('data', (data) => {
                    const chunk = data.toString();
                    if (this.config.logLevel !== 'error') {
                        this.logger.log('오류: ' + chunk);
                    }
                });

                pythonProcess.on('close', async (code) => {
                    try {
                        if (this.tempFilePath) {
                            const tempFileUri = vscode.Uri.file(this.tempFilePath);
                            await vscode.workspace.fs.delete(tempFileUri);
                        }
                    } catch (error) {
                        this.logger.log('임시 파일 삭제 오류: ' + error);
                    }

                    if (code === 0 && this.currentBacktest) {
                        // 성능 지표 계산
                        this.calculatePerformanceMetrics();
                        resolve(this.currentBacktest);
                    } else {
                        reject(new Error(`Python 프로세스가 코드 ${code}로 종료되었습니다.`));
                    }
                });

                pythonProcess.on('error', async (error) => {
                    try {
                        if (this.tempFilePath) {
                            const tempFileUri = vscode.Uri.file(this.tempFilePath);
                            await vscode.workspace.fs.delete(tempFileUri);
                        }
                    } catch (deleteError) {
                        console.error('임시 파일 삭제 오류:', deleteError);
                    }
                    reject(error);
                });
            });
        } catch (error) {
            throw error;
        }
    }
} 