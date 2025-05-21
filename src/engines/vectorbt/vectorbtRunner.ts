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
      this.logger.log('Trade data parse error: ' + error);
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
      this.logger.log('Equity data parse error: ' + error);
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
      this.logger.log('Backtest result update error: ' + error);
    }
  }

  /**
   * Calculate backtest performance metrics
   */
  private calculatePerformanceMetrics(): void {
    if (!this.currentBacktest) return;

    // Calculate trade-related metrics
    const tradeCount = Object.keys(this.currentBacktest.trades).length;
    if (tradeCount > 0) {
      const profitableTrades = Object.values(this.currentBacktest.trades)
        .filter(trade => trade.exits.length > 0 && trade.exits[trade.exits.length - 1].pnlcomm > 0)
        .length;
      this.currentBacktest.performance.trades = tradeCount;
      this.currentBacktest.performance.winRate = profitableTrades / tradeCount;
    }

    // Calculate equity-related metrics
    if (this.currentBacktest.equity.length > 0) {
      const initialValue = this.currentBacktest.equity[0].value;
      const finalValue = this.currentBacktest.equity[this.currentBacktest.equity.length - 1].value;
      this.currentBacktest.performance.totalReturn = (finalValue - initialValue) / initialValue;
      
      // Calculate maximum drawdown
      let maxDrawdown = 0;
      let peak = initialValue;
      
      for (const equityPoint of this.currentBacktest.equity) {
        const currentValue = equityPoint.value;
        
        // Find new peak
        if (currentValue > peak) {
          peak = currentValue;
        }
        
        // Calculate current drawdown
        const drawdown = (peak - currentValue) / peak;
        
        // Update maximum drawdown
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      this.currentBacktest.performance.maxDrawdown = maxDrawdown;

      // Calculate Sharpe ratio
      // Assume 2% risk-free rate
      const riskFreeRate = 0.02;
      
      // Calculate daily returns
      const dailyReturns: number[] = [];
      for (let i = 1; i < this.currentBacktest.equity.length; i++) {
        const prevValue = this.currentBacktest.equity[i-1].value;
        const currentValue = this.currentBacktest.equity[i].value;
        const dailyReturn = (currentValue - prevValue) / prevValue;
        dailyReturns.push(dailyReturn);
      }
      
      // Calculate average return
      const avgReturn = dailyReturns.reduce((sum, return_) => sum + return_, 0) / dailyReturns.length;
      
      // Calculate standard deviation
      const variance = dailyReturns.reduce((sum, return_) => {
        const diff = return_ - avgReturn;
        return sum + (diff * diff);
      }, 0) / dailyReturns.length;
      
      const stdDev = Math.sqrt(variance);
      
      // Calculate annualized Sharpe ratio (assume 252 trading days)
      const annualizedAvgReturn = avgReturn * 252;
      const annualizedStdDev = stdDev * Math.sqrt(252);
      const sharpeRatio = (annualizedAvgReturn - riskFreeRate) / annualizedStdDev;
      
      // Prevent NaN
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
      throw new Error('Workspace folder not found.');
    }
    
    const tempDirPath = path.join(workspaceFolder.uri.fsPath, '.temp');
    const tempDirUri = vscode.Uri.file(tempDirPath);
    
    try {
      // Check if .temp directory exists
      await vscode.workspace.fs.stat(tempDirUri);
    } catch (error) {
      // Create directory if it doesn't exist
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
      // Show output channel
      this.logger.revealPanel();
      
      // Create new backtest result object
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

      // Output backtest start message
      this.logger.log('========================================');
      this.logger.log('[+] Backtest started...');
      this.logger.log(`[+] Strategy: ${this.config.strategy}`);
      this.logger.log(`[+] Project path: ${this.currentProject?.path}`);
      this.logger.log(`[+] Backtest engine: vectorbt`);
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
            this.logger.log('Error: ' + chunk);
          }
        });

        pythonProcess.on('close', async (code) => {
          try {
            if (this.tempFilePath) {
              const tempFileUri = vscode.Uri.file(this.tempFilePath);
              await vscode.workspace.fs.delete(tempFileUri);
            }
          } catch (error) {
            this.logger.log('Error deleting temporary file: ' + error);
          }

          if (code === 0 && this.currentBacktest) {
            // Calculate performance metrics
            this.calculatePerformanceMetrics();
            resolve(this.currentBacktest);
          } else {
            reject(new Error(`Python process exited with code ${code}.`));
          }
        });

        pythonProcess.on('error', async (error) => {
          try {
            if (this.tempFilePath) {
              const tempFileUri = vscode.Uri.file(this.tempFilePath);
              await vscode.workspace.fs.delete(tempFileUri);
            }
          } catch (deleteError) {
            console.error('Error deleting temporary file:', deleteError);
          }
          reject(error);
        });
      });
    } catch (error) {
      throw error;
    }
  }
} 