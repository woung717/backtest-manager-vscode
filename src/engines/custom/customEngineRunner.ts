import { CustomEngineConfig } from './types';
import { ProjectInfo, Backtest } from '../../types';
import { BaseRunner } from '../common/baseRunner';
import { generateShortHash } from '../../util';

export class CustomEngineRunner extends BaseRunner<CustomEngineConfig> {
  protected readonly templatePath: string = '';

  constructor(project: ProjectInfo, config: CustomEngineConfig) {
    super(project, config);
  }

  protected async renderScript(pythonCode: string): Promise<string> { return pythonCode; }

  public async runBacktest(pythonCode: string): Promise<Backtest> {
    this.logger.revealPanel();
    
    this.currentBacktest = {
      id: generateShortHash(Date.now().toString()),
      date: new Date().toISOString(),
      strategy: this.config.strategy,
      performance: {
        totalReturn: 0,
        annualizedReturn: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        trades: 0,
        calmarRatio: 0,
        avgWinLossRatio: 0,
        skewness: 0,
        kurtosis: 0
      },
      equity: [],
      trades: {}
    };

    // Output backtest start message
    this.logger.log('========================================');
    this.logger.log('[+] Backtest started...');
    this.logger.log(`[+] Project path: ${this.currentProject?.path}`);
    this.logger.log(`[+] Backtest engine: ${this.currentProject?.engine}`);
    this.logger.log('========================================');

    return await this.run(pythonCode);
  }
}