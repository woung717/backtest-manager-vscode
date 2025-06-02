import { Equity,TradeInfo } from '../../types';


export interface BacktestRunner {
  loadConfig(): any;
  setConfig(config: any): void;
  runBacktest(pythonCode: string): Promise<BacktestResult>;
}

export interface BacktestResult {
  id: string;
  success?: boolean;
  output?: string;
  error?: string;
  plotPath?: string;
  date: string;
  strategy: string;    
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    trades: number;
    calmarRatio: number;
    avgWinLossRatio: number;
    skewness: number;
    kurtosis: number;
  };
  equity: Equity[];
  trades: Record<string, TradeInfo>;
  config?: any;  // Configuration used for the backtest run
}  