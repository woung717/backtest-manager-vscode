// VectorBT backtest config types

// from_signals() settings
export interface VectorBTFromSignalsSettings {
  size: number;
  size_type: 'Amount' | 'Value' | 'Percent';
  fees: number;
  fixed_fees: number;
  slippage: number;
  min_size: number;
  max_size?: number;
  size_granularity: number;
  reject_prob: number;
  lock_cash: boolean;
  allow_partial: boolean;
  raise_reject: boolean;
  log: boolean;
  accumulate: boolean;
  direction: 'both' | 'longonly' | 'shortonly';
  sl_stop: number;
  sl_trail: boolean;
  tp_stop: number;
  use_stops: boolean;
  init_cash: number;
  cash_sharing: boolean;
  ffill_val_price: boolean;
  update_value: boolean;
}

// from_order_func() settings
export interface VectorBTFromOrderFuncSettings {
  flexible: boolean;
  init_cash: number;
  cash_sharing: boolean;
  segment_mask?: number;
  call_pre_segment: boolean;
  call_post_segment: boolean;
  ffill_val_price: boolean;
  update_value: boolean;
  fill_pos_record: boolean;
  row_wise: boolean;
  use_numba: boolean;
}

// from_orders() settings
export interface VectorBTFromOrdersSettings {
  size: number;
  size_type: 'Amount' | 'Value' | 'Percent';
  direction: 'both' | 'longonly' | 'shortonly';
  fees: number;
  fixed_fees: number;
  slippage: number;
  min_size: number;
  max_size?: number;
  size_granularity: number;
  reject_prob: number;
  lock_cash: boolean;
  allow_partial: boolean;
  raise_reject: boolean;
  log: boolean;
  init_cash: number;
  cash_sharing: boolean;
  ffill_val_price: boolean;
  update_value: boolean;
}

// VectorBT function type
export type VectorBTFunctionType = 'from_signals' | 'from_order_func' | 'from_orders';

// VectorBT backtest config
export interface VectorBTConfig {
  pythonPath: string;        // Python binary path
    
  strategy: string;
  strategyParams?: Record<string, any>;
  logLevel?: 'debug' | 'info' | 'warning' | 'error';

  functionType: VectorBTFunctionType;
  settings: {
    from_signals: VectorBTFromSignalsSettings;
    from_order_func: VectorBTFromOrderFuncSettings;
    from_orders: VectorBTFromOrdersSettings;
  }
  dataset?: string;
  env?: Record<string, string>;
}
