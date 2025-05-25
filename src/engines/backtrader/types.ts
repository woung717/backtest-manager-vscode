// Broker slippage settings
export interface BrokerSlippageConfig {
  slippagePerc?: number;    // Price slippage percentage (e.g., 0.01 = 1%)
  slippageFixed?: number;   // Fixed slippage value
  slippageOpen?: boolean;   // Apply slippage to open orders
  slippageMatch?: boolean;  // Limit slippage within high/low range
  slippageLimit?: boolean;  // Apply slippage to limit orders
  slippageOut?: boolean;    // Allow slippage outside high/low range
}

// Broker commission settings
export interface BrokerCommissionConfig {
  commission?: number;    // Commission rate
  margin?: number;       // Margin
  mult?: number;       // Multiplier
  percabs?: boolean;     // Calculate commission based on absolute value
  stocklike?: boolean;     // Is it a stock-like asset?
  interest?: number;     // Interest rate
  interestLong?: boolean;  // Apply interest to long positions
  leverage?: number;     // Leverage
  automargin?: boolean;    // Calculate margin automatically
}

// Broker settings
export interface BrokerConfig {
  initialCapital: number;   // Initial capital
  checkSubmit?: boolean;    // Check margin/cash before submitting order
  eosbar?: boolean;       // Treat end-of-session bar as session end
  slippage?: BrokerSlippageConfig; // Slippage settings
  commissionScheme?: BrokerCommissionConfig; // Detailed commission settings
  coc?: boolean;        // Cheat-On-Close setting
  coo?: boolean;        // Cheat-On-Open setting
  int2pnl?: boolean;     // Include interest in profit/loss
  shortcash?: boolean;     // Cash handling for short positions
  fundstartval?: number;   // Fund start value
  fundmode?: boolean;    // Enable fund mode
}

export interface BacktraderConfig {
  pythonPath: string;
  datasetPaths?: string[]; 
  
  strategy: string;
  strategyParams?: Record<string, any>;
  
  plotEnabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warning' | 'error';

  preload?: boolean;       // Preload data feeds (default: true)
  runonce?: boolean;      // Run indicators in vectorized mode (default: true)
  live?: boolean;       // Enable live trading mode (default: false)
  maxcpus?: number;       // Number of CPU cores for optimization (default: undefined - use all cores)
  stdstats?: boolean;     // Add default observers (default: true)
  oldbuysell?: boolean;     // Use old buy/sell signal display style (default: false)
  oldtrades?: boolean;    // Use old trade display style (default: false)
  exactbars?: number | boolean; // Memory usage optimization setting (default: false)

  broker: BrokerConfig;
  
  env?: Record<string, string>; // Environment variable settings
}

export interface BacktestRunner {
  loadConfig(): BacktraderConfig;
  setConfig(config: BacktraderConfig): void;
  runBacktest(pythonCode: string): Promise<BacktestResult>;
}

import { Equity,TradeInfo } from '../../types';

export interface BacktestResult {
  id: string;
  success?: boolean;
  output?: string;
  error?: string;
  plotPath?: string;
  date: string;
  strategy: string;    performance: {
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
  equity: Array<Equity>;
  trades: Record<string, TradeInfo>;
  config?: any;  // Configuration used for the backtest run
}  