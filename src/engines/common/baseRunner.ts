import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { Backtest, ProjectInfo, TradeEnterData, TradeExitData, TradeInfo } from '../../types';
import { VSCodeOutputLogger } from '../../vscodeOutputLogger';

enum DataType {
  TRADE,
  EQUITY
}

export abstract class BaseRunner<T> {
  protected config: T;
  protected tempFilePath = '';
  protected currentProject?: ProjectInfo;
  protected currentBacktest?: Backtest;
  protected logger: VSCodeOutputLogger = VSCodeOutputLogger.getInstance("Backtest Runner");
  protected debugMode = vscode.workspace.getConfiguration('backtestManager').get('verboseBacktestEngine') as boolean;
  protected preserveTempFiles = vscode.workspace.getConfiguration('backtestManager').get('preserveBacktestScriptFile') as boolean;
  protected abstract readonly templatePath: string;

  constructor(project: ProjectInfo, config: T) {
    this.config = config;
    this.currentProject = project;
  }

  public loadConfig(): T {
    return this.config;
  }

  public setConfig(config: T): void {
    this.config = config;
  }

  public setProject(project: ProjectInfo): void {
    this.currentProject = project;
  }

  protected parseTradeData(line: string): any {
    try {
      const data = JSON.parse(line.substring(line.indexOf('{')));
      if (data.ref) {
        return data;
      }
      return null;
    } catch (error) {
      this.logger.log(`Error parsing trade data: ${error}`);
      return null;
    }
  }

  protected parseEquityData(line: string): any {
    try {
      const data = JSON.parse(line.substring(line.indexOf('{')));
      if (data.value && data.datetime) {
        return data;
      }
      return null;
    } catch (error) {
      this.logger.log(`Error parsing equity data: ${error}`);
      return null;
    }
  }

  protected async updateBacktestResult(data: any, type: DataType): Promise<void> {
    if (!this.currentBacktest?.id) {
      return;
    }

    try {
      if (type === DataType.TRADE) {
        if (!this.currentBacktest.trades) {
          this.currentBacktest.trades = {};
        }

        if (data.ref && !data.pnl) {
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
        } else if (data.ref && data.pnl) {
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
      } else if (type === DataType.EQUITY) {
        if (!this.currentBacktest.equity) {
          this.currentBacktest.equity = [];
        }
        
        // Check if the equity value is already present to avoid duplicates
        if (this.currentBacktest.equity.length > 0) {
          const lastEquity = this.currentBacktest.equity[this.currentBacktest.equity.length - 1];
          if (Number.parseFloat(lastEquity.value.toString()).toFixed(8) === 
              Number.parseFloat(data.value.toString()).toFixed(8)) {
            return;
          }
        }
        
        this.currentBacktest.equity.push({
          datetime: data.datetime,
          value: data.value
        });
      }
    } catch (error) {
      this.logger.log(`Error updating backtest result: ${error}`);
    }
  }

  protected calculatePerformanceMetrics(): void {
    if (!this.currentBacktest) {
      return;
    }

    const tradeCount = Object.keys(this.currentBacktest.trades).length;
    if (tradeCount > 0) {
      let totalWins = 0;
      let totalLosses = 0;
      let winCount = 0;
      let lossCount = 0;

      Object.values(this.currentBacktest.trades).forEach((trade: TradeInfo) => {
        if (trade.exits.length > 0) {
          const lastExit = trade.exits[trade.exits.length - 1];
          if (lastExit.pnlcomm > 0) {
            totalWins += lastExit.pnlcomm;
            winCount++;
          } else {
            totalLosses += Math.abs(lastExit.pnlcomm);
            lossCount++;
          }
        }
      });

      this.currentBacktest.performance.trades = tradeCount;
      this.currentBacktest.performance.winRate = winCount / tradeCount;
      this.currentBacktest.performance.profitFactor = totalLosses > 0 ? 
        totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

      const avgWin = winCount > 0 ? totalWins / winCount : 0;
      const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
      this.currentBacktest.performance.avgWinLossRatio = avgLoss > 0 ? 
        avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    }

    if (this.currentBacktest.equity.length > 0) {
      const initialValue = this.currentBacktest.equity[0].value;
      const finalValue = this.currentBacktest.equity[this.currentBacktest.equity.length - 1].value;
      const totalReturn = (finalValue - initialValue) / initialValue;
      this.currentBacktest.performance.totalReturn = totalReturn;

      let maxDrawdown = 0;
      let peak = initialValue;
      
      for (const equityPoint of this.currentBacktest.equity) {
        const currentValue = equityPoint.value;
        if (currentValue > peak) { peak = currentValue; }
        const drawdown = (peak - currentValue) / peak;
        if (drawdown > maxDrawdown) { maxDrawdown = drawdown; }
      }
      
      this.currentBacktest.performance.maxDrawdown = maxDrawdown;
      const timePeriodInYears = this.currentBacktest.equity.length / 252;
      const annualizedReturn = Math.pow(1 + totalReturn, 1 / timePeriodInYears) - 1;
      this.currentBacktest.performance.annualizedReturn = annualizedReturn;
      this.currentBacktest.performance.calmarRatio = maxDrawdown > 0 ? 
        annualizedReturn / maxDrawdown : 0;

      const riskFreeRate = 0.02;
      const dailyReturns: number[] = [];
      for (let i = 1; i < this.currentBacktest.equity.length; i++) {
        const prevValue = this.currentBacktest.equity[i-1].value;
        const currentValue = this.currentBacktest.equity[i].value;
        dailyReturns.push((currentValue - prevValue) / prevValue);
      }
      
      const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, r) => {
        const diff = r - avgReturn;
        return sum + (diff * diff);
      }, 0) / dailyReturns.length;
      
      const stdDev = Math.sqrt(variance);
      const thirdMoment = dailyReturns.reduce((sum, r) => {
        const diff = r - avgReturn;
        return sum + (diff * diff * diff);
      }, 0) / dailyReturns.length;
      const skewness = thirdMoment / Math.pow(stdDev, 3);
      this.currentBacktest.performance.skewness = isNaN(skewness) ? 0 : skewness;

      const fourthMoment = dailyReturns.reduce((sum, r) => {
        const diff = r - avgReturn;
        return sum + (diff * diff * diff * diff);
      }, 0) / dailyReturns.length;
      const kurtosis = (fourthMoment / Math.pow(stdDev, 4)) - 3;
      this.currentBacktest.performance.kurtosis = isNaN(kurtosis) ? 0 : kurtosis;
      
      const annualizedAvgReturn = avgReturn * 252;
      const annualizedStdDev = stdDev * Math.sqrt(252);
      const sharpeRatio = (annualizedAvgReturn - riskFreeRate) / annualizedStdDev;
      this.currentBacktest.performance.sharpeRatio = isNaN(sharpeRatio) ? 0 : sharpeRatio;

      const negativeReturns = dailyReturns.filter(r => r < 0);
      const negativeReturnVariance = negativeReturns.reduce((sum, r) => {
        return sum + (r * r);
      }, 0) / (negativeReturns.length || 1);
      const negativeStdDev = Math.sqrt(negativeReturnVariance);
      const annualizedNegativeStdDev = negativeStdDev * Math.sqrt(252);
      const sortinoRatio = (annualizedAvgReturn - riskFreeRate) / annualizedNegativeStdDev;
      this.currentBacktest.performance.sortinoRatio = isNaN(sortinoRatio) ? 0 : sortinoRatio;
    }
  }

  protected async createTempPythonFile(pythonCode: string): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Workspace folder not found');
    }
    
    const tempDirPath = path.join(workspaceFolder.uri.fsPath, '.temp');
    const tempDirUri = vscode.Uri.file(tempDirPath);
    
    try {
      await vscode.workspace.fs.stat(tempDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(tempDirUri);
    }
    
    const filePrefix = this.constructor.name.toLowerCase().replace('runner', '');
    this.tempFilePath = path.join(tempDirPath, `${filePrefix}_${Date.now()}.py`);
    const tempFileUri = vscode.Uri.file(this.tempFilePath);
    
    const pythonScript = await this.renderScript(pythonCode);
    await vscode.workspace.fs.writeFile(tempFileUri, Buffer.from(pythonScript, 'utf8'));
    
    return this.tempFilePath;
  }

  protected async run(pythonCode: string): Promise<Backtest> {
    const pythonFilePath = await this.createTempPythonFile(pythonCode);
    
    return new Promise<Backtest>((resolve, reject) => {
      const pythonProcess = spawn(
        (this.config as any).pythonPath, 
        [pythonFilePath],
        {
          cwd: this.currentProject?.path,
          env: (this.config as any).env 
        }
      );

      let stdoutBuffer = '';
      pythonProcess.stdout.on('data', async (data) => {
        stdoutBuffer += data.toString();

        let newlineIndex: number;
        while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
          const line = stdoutBuffer.slice(0, newlineIndex);
          stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);

          if (line.startsWith('t:')) {
            const tradeData = this.parseTradeData(line);
            if (tradeData) {
              await this.updateBacktestResult(tradeData, DataType.TRADE);
            }
          } else if (line.startsWith('e:')) {
            const equityData = this.parseEquityData(line);
            if (equityData) {
              await this.updateBacktestResult(equityData, DataType.EQUITY);
            }
          }

          if (this.debugMode && line.trim().length > 0) {
            this.logger.log(line);
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();

        if (this.debugMode) {
          this.logger.log('Error: ' + chunk);
        }
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (this.tempFilePath && this.preserveTempFiles === false) {
            const tempFileUri = vscode.Uri.file(this.tempFilePath);
            vscode.workspace.fs.delete(tempFileUri);
          }
        } catch (error) {
          this.logger.log('Error deleting temporary file: ' + error);
        }

        if (code === 0 && this.currentBacktest) {
          this.calculatePerformanceMetrics();
          resolve(this.currentBacktest);
        } else {
          reject(new Error(`Python process exited with code ${code}.`));
        }
      });

      pythonProcess.on('error', async (error) => {
        try {
          if (this.tempFilePath && this.preserveTempFiles === false) {
            const tempFileUri = vscode.Uri.file(this.tempFilePath);
            vscode.workspace.fs.delete(tempFileUri);
          }
        } catch (deleteError) {
          console.error('Error deleting temporary file:', deleteError);
        }
        reject(error);
      });
    });
  }

  protected abstract renderScript(pythonCode: string): Promise<string>;
  public abstract runBacktest(pythonCode: string): Promise<Backtest>;
}
