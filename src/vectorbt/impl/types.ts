// vectorbt 슬리피지 설정
export interface VectorBTSlippageConfig {
    slippagePerc?: number;      // 가격 슬리피지 퍼센트 (예: 0.01 = 1%)
    slippageFixed?: number;     // 고정 슬리피지 값
}

// vectorbt 수수료 설정
export interface VectorBTCommissionConfig {
    commission?: number;        // 수수료율
    commtype?: 'percentage' | 'fixed';  // 수수료 유형
}

// vectorbt 브로커 설정
export interface VectorBTBrokerConfig {
    initialCapital: number;     // 초기 자본금
    leverage?: number;          // 레버리지
    slippage?: VectorBTSlippageConfig; // 슬리피지 설정
    commissionScheme?: VectorBTCommissionConfig; // 수수료 설정
    fractional?: boolean;       // 부분 포지션 허용 여부 
}

export interface VectorBTConfig {
    pythonPath: string;        // Python 바이너리 경로
    
    strategy: string;
    strategyParams?: Record<string, any>;
    
    plotEnabled?: boolean;
    logLevel?: 'debug' | 'info' | 'warning' | 'error';
    
    broker: VectorBTBrokerConfig;
    
    env?: Record<string, string>; // 환경 변수 설정
}

export interface VectorBTRunner {
    loadConfig(): VectorBTConfig;
    setConfig(config: VectorBTConfig): void;
    runBacktest(pythonCode: string): Promise<BacktestResult>;
}

import { BacktestResult } from '../../backtrader/impl/types'; 