import React, { useState } from 'react';
import VSCodeAPI from '../../lib/VSCodeAPI';
import { ProjectInfo, DatasetInfo } from '../../../types';

type VectorBTSettingViewProps = {
  currentProject?: ProjectInfo;
  datasets?: DatasetInfo[];
  lastConfig?: any;
};

const VectorBTSettingView: React.FC<VectorBTSettingViewProps> = ({ currentProject, datasets = [], lastConfig }) => {
  // Function type selection
  const [selectedFunction, setSelectedFunction] = useState<'from_signals' | 'from_order_func' | 'from_orders'>('from_signals');

  // from_signals settings
  const [signalSettings, setSignalSettings] = useState({
    size: 1.0,
    size_type: 'Amount', // 'Amount', 'Value', 'Percent'
    fees: 0,
    fixed_fees: 0,
    slippage: 0,
    min_size: 0,
    max_size: undefined as number | undefined,
    size_granularity: 0,
    reject_prob: 0,
    lock_cash: false,
    allow_partial: true,
    raise_reject: false,
    log: true,
    accumulate: false,
    direction: 'both', // 'both', 'longonly', 'shortonly'
    sl_stop: 0,
    sl_trail: false,
    tp_stop: 0,
    use_stops: false,
    init_cash: 100000,
    cash_sharing: false,
    ffill_val_price: true,
    update_value: true,
  });

  // from_order_func settings
  const [orderFuncSettings, setOrderFuncSettings] = useState({
    flexible: false,
    init_cash: 100000,
    cash_sharing: false,
    segment_mask: undefined as number | undefined,
    call_pre_segment: false,
    call_post_segment: false,
    ffill_val_price: true,
    update_value: true,
    fill_pos_record: true,
    row_wise: false,
    use_numba: true,
  });

  // from_orders settings
  const [orderSettings, setOrderSettings] = useState({
    size: 1.0,
    size_type: 'Amount', // 'Amount', 'Value', 'Percent'
    direction: 'both', // 'both', 'longonly', 'shortonly'
    fees: 0,
    fixed_fees: 0,
    slippage: 0,
    min_size: 0,
    max_size: undefined as number | undefined,
    size_granularity: 0,
    reject_prob: 0,
    lock_cash: false,
    allow_partial: true,
    raise_reject: false,
    log: true,
    init_cash: 100000,
    cash_sharing: false,
    ffill_val_price: true,
    update_value: true,
  });

  // Dataset state management
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  // Environment variable state management
  const [envVariables, setEnvVariables] = useState<{
    id: string;
    key: string;
    value: string;
  }[]>([]);

  // Add new environment variable
  const addEnvVariable = () => {
    const newId = `env_${Date.now()}`;
    setEnvVariables([...envVariables, { id: newId, key: '', value: '' }]);
  };
  
  // Remove environment variable
  const removeEnvVariable = (id: string) => {
    setEnvVariables(envVariables.filter(env => env.id !== id));
  };
  
  // Change environment variable value
  const updateEnvVariable = (id: string, field: 'key' | 'value', newValue: string) => {
    setEnvVariables(
      envVariables.map(env => 
        env.id === id ? { ...env, [field]: newValue } : env
      )
    );
  };

  // Initialize settings based on last configuration
  React.useEffect(() => {
    if (lastConfig) {
      // Function type selection
      if (lastConfig.functionType) {
        setSelectedFunction(lastConfig.functionType);
      }

      // Settings based on function type
      if (lastConfig) {
        switch (lastConfig.functionType) {
          case 'from_signals':
            setSignalSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_signals
            }));
            break;
          case 'from_order_func':
            setOrderFuncSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_order_func
            }));
            break;
          case 'from_orders':
            setOrderSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_orders
            }));
            break;
        }
      }
      
      // Dataset selection
      if (lastConfig.dataset) {
        setSelectedDataset(lastConfig.dataset);
      }

      // Environment variables
      if (lastConfig.env) {
        const envVars: { id: string; key: string; value: string }[] = [];
        Object.entries(lastConfig.env).forEach(([key, value]) => {
          envVars.push({
            id: `env_${Date.now()}_${key}`,
            key,
            value: value as string
          });
        });
        if (envVars.length > 0) {
          setEnvVariables(envVars);
        }
      }
    }
  }, [lastConfig]);

  const handleRunBacktest = () => {
    // Create environment variable object
    const envObject: Record<string, string> = {};
    envVariables.forEach(env => {
      if (env.key.trim()) {
        envObject[env.key.trim()] = env.value;
      }
    });

    const config = {
      functionType: selectedFunction,
      settings: {
        from_signals: signalSettings,
        from_order_func: orderFuncSettings,
        from_orders: orderSettings
      },
      dataset: selectedDataset,
      env: envObject
    };

    VSCodeAPI.postMessage({
      type: 'runBacktest',
      config,
    });
  };

  // Group datasets by asset type
  const groupedDatasets = datasets.reduce((acc, dataset) => {
    if (!acc[dataset.assetType]) {
      acc[dataset.assetType] = [];
    }
    acc[dataset.assetType].push(dataset);
    return acc;
  }, {} as Record<string, DatasetInfo[]>);

  return (
    <div className="flex flex-col space-y-4 mt-2 mb-2">
      <div id="projectInfo" className="text-sm text-[var(--vscode-descriptionForeground)] mb-2 whitespace-pre-line] border border-[var(--vscode-input-border)] p-2 rounded">
        {currentProject ? (
          <p>
            Project: {currentProject.name} <br />
            Directory: {currentProject.path} <br />
            Backtest Engine: {currentProject.engine}
          </p>
        ) : (
          'Select a project'
        )}
      </div>

      {/* Dataset Selection Section */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Select Dataset
          </label>
        </div>
        <div className="text-sm text-[var(--vscode-descriptionForeground)] mb-2">
          Select the dataset to use for backtesting.
        </div>
        
        {datasets.length === 0 ? (
          <div className="text-sm text-[var(--vscode-errorForeground)] mb-2">
            No datasets available. Upload datasets in the Dataset Manager.
          </div>
        ) : (
          <div className="space-y-2">
            <select
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1"
              value={selectedDataset || ''}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              <option value="">-- Select Dataset --</option>
              {Object.entries(groupedDatasets).map(([assetType, datasets]) => (
                <optgroup key={assetType} label={assetType}>
                  {datasets.map(dataset => (
                    <option 
                      key={dataset.path} 
                      value={dataset.path}
                    >
                      {dataset.exchange} - {dataset.symbol} - {dataset.timeframe} ({dataset.name})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button
              className="text-sm text-[var(--vscode-button-foreground)] bg-[var(--vscode-button-background)] rounded px-2 py-1 hover:bg-[var(--vscode-button-hoverBackground)]"
              onClick={() => {
                VSCodeAPI.postMessage({ type: 'refresh' });
              }}
            >
              Reload Datasets
            </button>
          </div>
        )}
      </div>

      {/* Function Type Selection */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Backtest Function
          </label>
        </div>
        <select
          className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1"
          value={selectedFunction}
          onChange={(e) => setSelectedFunction(e.target.value as 'from_signals' | 'from_order_func' | 'from_orders')}
        >
          <option value="from_signals">from_signals() - Vectorized</option>
          <option value="from_orders">from_orders() - Vectorized</option>
          <option value="from_order_func">from_order_func() - Event Driven</option>
        </select>
      </div>

      {/* Function Specific Settings */}
      {selectedFunction === 'from_signals' ? (
        <div className="space-y-3">
          {/* Size Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Size Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="size" className="text-sm">Size</label>
                <input
                  type="number"
                  id="size"
                  value={signalSettings.size}
                  min="0"
                  step="0.1"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="size_type" className="text-sm">Size Type</label>
                <select
                  id="size_type"
                  value={signalSettings.size_type}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, size_type: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="Amount">Amount</option>
                  <option value="Value">Value</option>
                  <option value="Percent">Percent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fee Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Fee Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="fees" className="text-sm">Fees (%)</label>
                <input
                  type="number"
                  id="fees"
                  value={signalSettings.fees}
                  min="0"
                  step="0.01"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, fees: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="fixed_fees" className="text-sm">Fixed Fees</label>
                <input
                  type="number"
                  id="fixed_fees"
                  value={signalSettings.fixed_fees}
                  min="0"
                  step="0.01"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, fixed_fees: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
          </div>

          {/* Stop Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Stop Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="sl_stop" className="text-sm">Stop Loss (%)</label>
                <input
                  type="number"
                  id="sl_stop"
                  value={signalSettings.sl_stop}
                  min="0"
                  step="0.1"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, sl_stop: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="tp_stop" className="text-sm">Take Profit (%)</label>
                <input
                  type="number"
                  id="tp_stop"
                  value={signalSettings.tp_stop}
                  min="0"
                  step="0.1"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, tp_stop: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={signalSettings.sl_trail}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, sl_trail: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Trailing Stop Loss</span>
              </label>
            </div>
          </div>

          {/* Other Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Other Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="init_cash" className="text-sm">Initial Cash</label>
                <input
                  type="number"
                  id="init_cash"
                  value={signalSettings.init_cash}
                  min="0"
                  step="1000"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, init_cash: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="direction" className="text-sm">Direction</label>
                <select
                  id="direction"
                  value={signalSettings.direction}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="both">Both</option>
                  <option value="longonly">Long Only</option>
                  <option value="shortonly">Short Only</option>
                </select>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={signalSettings.accumulate}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, accumulate: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Accumulate</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={signalSettings.cash_sharing}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Cash Sharing</span>
              </label>
            </div>
          </div>
        </div>
      ) : selectedFunction === 'from_orders' ? (
        <div className="space-y-3">
          {/* Size Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Size Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="size" className="text-sm">Size</label>
                <input
                  type="number"
                  id="size"
                  value={orderSettings.size}
                  min="0"
                  step="0.1"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="size_type" className="text-sm">Size Type</label>
                <select
                  id="size_type"
                  value={orderSettings.size_type}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, size_type: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="Amount">Amount</option>
                  <option value="Value">Value</option>
                  <option value="Percent">Percent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fee Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Fee Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="fees" className="text-sm">Fees (%)</label>
                <input
                  type="number"
                  id="fees"
                  value={orderSettings.fees}
                  min="0"
                  step="0.01"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, fees: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="fixed_fees" className="text-sm">Fixed Fees</label>
                <input
                  type="number"
                  id="fixed_fees"
                  value={orderSettings.fixed_fees}
                  min="0"
                  step="0.01"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, fixed_fees: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
          </div>

          {/* Size Constraints */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Size Constraints
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="min_size" className="text-sm">Minimum Size</label>
                <input
                  type="number"
                  id="min_size"
                  value={orderSettings.min_size}
                  min="0"
                  step="0.1"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, min_size: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="max_size" className="text-sm">Maximum Size</label>
                <input
                  type="number"
                  id="max_size"
                  value={orderSettings.max_size || ''}
                  min="0"
                  step="0.1"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, max_size: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            <div className="mt-2">
              <div className="space-y-1">
                <label htmlFor="size_granularity" className="text-sm">Size Granularity</label>
                <input
                  type="number"
                  id="size_granularity"
                  value={orderSettings.size_granularity}
                  min="0"
                  step="0.00000001"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, size_granularity: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Other Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="init_cash" className="text-sm">Initial Cash</label>
                <input
                  type="number"
                  id="init_cash"
                  value={orderSettings.init_cash}
                  min="0"
                  step="1000"
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, init_cash: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="direction" className="text-sm">Direction</label>
                <select
                  id="direction"
                  value={orderSettings.direction}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="both">Both</option>
                  <option value="longonly">Long Only</option>
                  <option value="shortonly">Short Only</option>
                </select>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.lock_cash}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, lock_cash: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Lock Cash</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.allow_partial}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, allow_partial: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Allow Partial</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.raise_reject}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, raise_reject: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Raise Reject</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.log}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, log: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Log</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.cash_sharing}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Cash Sharing</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderSettings.ffill_val_price}
                  onChange={(e) => setOrderSettings(prev => ({ ...prev, ffill_val_price: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Fill Val Price</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Order Function Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Order Function Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="init_cash" className="text-sm">Initial Cash</label>
                <input
                  type="number"
                  id="init_cash"
                  value={orderFuncSettings.init_cash}
                  min="0"
                  step="1000"
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, init_cash: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="segment_mask" className="text-sm">Segment Mask</label>
                <input
                  type="number"
                  id="segment_mask"
                  value={orderFuncSettings.segment_mask || ''}
                  min="1"
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, segment_mask: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.flexible}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, flexible: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Flexible</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.cash_sharing}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Cash Sharing</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.call_pre_segment}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, call_pre_segment: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Call Pre Segment</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.call_post_segment}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, call_post_segment: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Call Post Segment</span>
              </label>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
            <div className="mb-1">
              <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
                Performance Settings
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.row_wise}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, row_wise: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Row Wise</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderFuncSettings.use_numba}
                  onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, use_numba: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Use Numba</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Environment variables setup */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-3 flex justify-between items-center">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Environment Variables
          </label>
          <button
            onClick={addEnvVariable}
            className="bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-1 px-2 text-xs rounded hover:bg-[var(--vscode-button-hoverBackground)]"
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {envVariables.length === 0 && (
            <div className="text-sm text-[var(--vscode-descriptionForeground)] italic">
              No environment variables set. Click the '+' button to add a variable.
            </div>
          )}
          {envVariables.map((env) => (
            <div key={env.id} className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Variable Name"
                  value={env.key}
                  onChange={(e) => updateEnvVariable(env.id, 'key', e.target.value)}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Value"
                  value={env.value}
                  onChange={(e) => updateEnvVariable(env.id, 'value', e.target.value)}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <button
                onClick={() => removeEnvVariable(env.id)}
                className="bg-[var(--vscode-editorError-foreground)] text-[var(--vscode-button-foreground)] py-1 px-2 text-xs rounded hover:bg-[var(--vscode-button-hoverBackground)]"
                title="Delete"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleRunBacktest}
        className="w-full bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-2 px-4 rounded hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        Run Backtest
      </button>
    </div>
  );
};

export default VectorBTSettingView;
