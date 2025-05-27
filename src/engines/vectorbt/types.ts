// VectorBT backtest config types

// from_signals() settings
export interface VectorBTFromSignalsSettings {
  size?: number;
  size_type?: 'Amount' | 'Value' | 'Percent';
  fees?: number;
  fixed_fees?: number;
  slippage?: number;
  min_size?: number;
  max_size?: number;
  size_granularity?: number;
  attach_call_seq?: boolean;
  seed?: number;
  max_logs?: number;
  max_orders?: number;
  reject_prob?: number;
  lock_cash?: boolean;
  allow_partial?: boolean;
  raise_reject?: boolean;
  log?: boolean;
  accumulate?: boolean;
  direction?: 'both' | 'longonly' | 'shortonly';
  sl_stop?: number;
  sl_trail?: boolean;
  tp_stop?: number;
  use_stops?: boolean;
  init_cash?: number;
  cash_sharing?: boolean;
  call_seq?: string | 'default' | 'reversed' | 'random' | 'auto';
  ffill_val_price?: boolean;
  update_value?: boolean;
  upon_long_conflict?: 'ignore' | 'entry' | 'exit' | 'adjacent' | 'opposite';
  upon_short_conflict?: 'ignore' | 'entry' | 'exit' | 'adjacent' | 'opposite';
  upon_dir_conflict?: 'ignore' | 'long' | 'short' | 'adjacent' | 'opposite';
  upon_opposite_entry?: 'ignore' | 'close' | 'close_reduce' | 'reverse' | 'reverse_reduce';
  stop_entry_price?: 'close' | 'open' | 'high' | 'low';
  stop_exit_price?: 'close' | 'open' | 'high' | 'low';
  upon_stop_exit?: 'close' | 'close_reduce' | 'reverse' | 'reverse_reduce';
  upon_stop_update?: 'keep' | 'override' | 'override_nan';
}

// from_order_func() settings
export interface VectorBTFromOrderFuncSettings {
  flexible?: boolean;
  init_cash?: number;
  cash_sharing?: boolean;
  segment_mask?: number;
  call_pre_segment?: boolean;
  call_post_segment?: boolean;
  ffill_val_price?: boolean;
  update_value?: boolean;
  fill_pos_record?: boolean;
  row_wise?: boolean;
  use_numba?: boolean;
  seed?: number;
  max_orders?: number;
  max_logs?: number;
  call_seq?: string | 'default' | 'reversed' | 'random' | 'auto';
  attach_call_seq?: boolean;
}

// from_orders() settings
export interface VectorBTFromOrdersSettings {
  size?: number;
  size_type?: 'Amount' | 'Value' | 'Percent';
  direction?: 'both' | 'longonly' | 'shortonly';
  call_seq?: string | 'default' | 'reversed' | 'random' | 'auto';
  attach_call_seq?: boolean;
  fees?: number;
  fixed_fees?: number;
  slippage?: number;
  min_size?: number;
  max_size?: number;
  size_granularity?: number;
  reject_prob?: number;
  lock_cash?: boolean;
  allow_partial?: boolean;
  raise_reject?: boolean;
  log?: boolean;
  init_cash?: number;
  cash_sharing?: boolean;
  ffill_val_price?: boolean;
  update_value?: boolean;
  seed?: number;
  max_orders?: number;
  max_logs?: number;
}

// VectorBT function type
export type VectorBTFunctionType = 'from_signals' | 'from_order_func' | 'from_orders';

// VectorBT backtest config
export interface VectorBTConfig {
  pythonPath: string;
  datasetPaths?: string[]; 

  strategy: string;
  strategyParams?: Record<string, any>;
  logLevel?: 'debug' | 'info' | 'warning' | 'error';

  functionType: VectorBTFunctionType;
  settings: {
    from_signals: VectorBTFromSignalsSettings;
    from_order_func: VectorBTFromOrderFuncSettings;
    from_orders: VectorBTFromOrdersSettings;
  }
  
  env?: Record<string, string>;
}
