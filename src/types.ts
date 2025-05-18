export interface ProjectInfo {
    _id?: string;  // NeDB에서 자동 생성되는 ID
    name: string;
    path: string;
    entryFile: string;
    engine: Engine;
    strategy?: string;
    description?: string;
    created?: Date;
    updated?: Date;
    results?: Backtest[];
    lastConfig?: any;  // 마지막으로 저장된 백테스트 설정값
}

export type Engine = 'backtrader' | 'vectorbt';

// 거래 진입 정보
export interface TradeEnterData {
    ref: string;            // 거래 참조 ID
    datetime: string;        // ISO 형식의 진입 시간
    price: number;          // 진입 가격
    size: number;           // 거래 수량
    value: number;          // 거래 가치
    commission: number;     // 수수료
    side: 'long' | 'short'; // 거래 방향
}

// 거래 청산 정보
export interface TradeExitData {
    ref: string;            // 거래 참조 ID
    datetime: string;       // ISO 형식의 청산 시간
    price: number;         // 청산 가격
    pnl: number;            // 순수익
    pnlcomm: number;        // 수수료 포함 순수익
    commission: number;     // 청산 수수료
    hold_bars: number;      // 보유 기간(봉 수)
    size: number;          // 청산 수량
}

// 개별 거래 정보
export interface TradeInfo {
    enter: TradeEnterData;
    exits: TradeExitData[];
}

export interface Backtest {
    id: string;
    date: string;
    strategy: string;
    performance: Performance;
    equity: Equity[];
    trades: Record<string, TradeInfo>;  // 거래 ID를 키로 하는 거래 정보
    config?: any;  // 백테스트 실행 시 사용된 설정값
}

export interface Performance {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    trades: number;
}

export interface Equity {
    datetime: string | number;
    value: number;
}

// 간단한 거래 정보 표시용 인터페이스
export interface Trade {
    id: string;            // TradeEnterData의 ref와 동일
    type: 'Long' | 'Short';  // TradeEnterData의 side를 기반으로 변환
    entry: number;         // TradeEnterData의 price
    exit: number;          // TradeExitData의 price
    time: string;          // TradeEnterData의 datetime
    profit: number;        // TradeExitData의 pnlcomm
    isProfit: boolean;     // TradeExitData의 pnlcomm > 0
}

// 데이터셋 정보를 표시하기 위한 인터페이스
export interface DatasetInfo {
    name: string;           // 데이터셋 파일 이름
    path: string;           // 전체 경로
    assetType: 'crypto' | 'stock' | 'forex'; // 자산 유형
    exchange: string;       // 거래소 이름
    symbol: string;         // 심볼 (예: BTC-USD, AAPL, EUR/USD)
    timeframe: string;      // 타임프레임 (예: 1D, 1H, 15M)
    startDate?: string;     // 데이터 시작일
    endDate?: string;       // 데이터 종료일
    totalBars?: number;     // 총 데이터 수
}


