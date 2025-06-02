import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { BacktraderConfig } from './types';
import { ProjectInfo, Backtest } from '../../types';
import { BaseRunner } from '../common/baseRunner';
import { generateShortHash } from '../../util';

function splitUserCode(userCode: string): { userImports: string; userCode: string } {
  const importLines: string[] = [];
  const otherLines: string[] = [];
  for (const line of userCode.split('\n') ) {
    if ( /^\s*(from .+ import )/.test(line) ) {
      importLines.push(line);
    } else {
      otherLines.push(line);
    }
  }
  return {
    userImports: importLines.join('\n'),
    userCode: otherLines.join('\n'),
  };
}

export class BacktraderRunner extends BaseRunner<BacktraderConfig> {
  protected readonly templatePath: string;

  constructor(project: ProjectInfo, config: BacktraderConfig) {
    super(project, config);
    this.templatePath = path.join(__dirname, '..', 'templates', 'backtrader.ejs');
  }

  protected async renderScript(pythonCode: string): Promise<string> {
    const template = await fs.promises.readFile(this.templatePath, 'utf8');
    const { userImports, userCode } = splitUserCode(pythonCode);
    return ejs.render(template, {
      project: this.currentProject,
      config: this.config,
      userImports,
      userCode
    });
  }

  public async runBacktest(pythonCode: string): Promise<Backtest> {
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
    this.logger.log('[+] Starting backtest...');
    this.logger.log(`[+] Strategy: ${this.config.strategy}`);
    this.logger.log(`[+] Project path: ${this.currentProject?.path}`);
    this.logger.log(`[+] Backtest engine: ${this.currentProject?.engine}`);
    this.logger.log('========================================');

    return await this.run(pythonCode);
    
  }
}