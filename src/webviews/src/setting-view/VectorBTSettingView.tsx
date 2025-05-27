import React, { useState } from 'react';
import { DatasetInfo, ProjectInfo } from '../../../types';
import VSCodeAPI from '../../lib/VSCodeAPI';
import DatasetSelector from './components/DatasetSelector';
import EnvironmentVariables from './components/EnvironmentVariables';
import { FromSignalsSettings } from './components/FromSignalsSettings';
import { FromOrdersSettings } from './components/FromOrdersSettings';
import { FromOrderFuncSettings } from './components/FromOrderFuncSettings';
import { VectorBTFromSignalsSettings, VectorBTFromOrdersSettings, VectorBTFromOrderFuncSettings } from '../../../engines/vectorbt/types';

type VectorBTSettingViewProps = {
  currentProject?: ProjectInfo;
  datasets?: DatasetInfo[];
  lastConfig?: any;
};

const VectorBTSettingView: React.FC<VectorBTSettingViewProps> = ({ currentProject, datasets = [], lastConfig }) => {
  const initCash = 10000;
  const defaultSize = 1.0;
  const defaultSizeType = 'Amount'; 
  const [selectedFunction, setSelectedFunction] = useState<'from_signals' | 'from_order_func' | 'from_orders'>('from_signals');

  // from_signals settings
  const [signalSettings, setSignalSettings] = useState<VectorBTFromSignalsSettings>({
    size: defaultSize,
    size_type: defaultSizeType, // Default to 'Amount' in UI or let user pick
    fees: undefined,
    fixed_fees: undefined,
    slippage: undefined,
    min_size: undefined,
    max_size: undefined,
    size_granularity: undefined,
    attach_call_seq: undefined,
    seed: undefined,
    max_logs: undefined,
    max_orders: undefined,
    reject_prob: undefined,
    lock_cash: undefined,
    allow_partial: undefined,
    raise_reject: undefined,
    log: undefined,
    accumulate: undefined,
    direction: undefined, // 'both', 'longonly', 'shortonly'
    sl_stop: undefined,
    sl_trail: undefined,
    tp_stop: undefined,
    use_stops: undefined,
    init_cash: initCash,
    cash_sharing: undefined,
    call_seq: undefined,
    ffill_val_price: undefined,
    update_value: undefined,
    upon_long_conflict: undefined,
    upon_short_conflict: undefined,
    upon_dir_conflict: undefined,
    upon_opposite_entry: undefined,
    stop_entry_price: undefined,
    stop_exit_price: undefined,
    upon_stop_exit: undefined,
    upon_stop_update: undefined,
  });

  // from_order_func settings
  const [orderFuncSettings, setOrderFuncSettings] = useState<VectorBTFromOrderFuncSettings>({
    flexible: undefined,
    init_cash: initCash,
    cash_sharing: undefined,
    segment_mask: undefined,
    call_pre_segment: undefined,
    call_post_segment: undefined,
    ffill_val_price: undefined,
    update_value: undefined,
    fill_pos_record: undefined,
    row_wise: undefined,
    use_numba: undefined,
    seed: undefined,
    max_orders: undefined,
    max_logs: undefined,
    call_seq: undefined, 
    attach_call_seq: undefined,
  });

  // from_orders settings
  const [orderSettings, setOrderSettings] = useState<VectorBTFromOrdersSettings>({
    size: defaultSize,
    size_type: defaultSizeType,
    direction: undefined,
    call_seq: undefined,
    attach_call_seq: undefined,
    fees: undefined,
    fixed_fees: undefined,
    slippage: undefined,
    min_size: undefined,
    max_size: undefined,
    size_granularity: undefined,
    reject_prob: undefined,
    lock_cash: undefined,
    allow_partial: undefined,
    raise_reject: undefined,
    log: undefined,
    init_cash: initCash,
    cash_sharing: undefined,
    ffill_val_price: undefined,
    update_value: undefined,
    seed: undefined,
    max_orders: undefined,
    max_logs: undefined,
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
      if (lastConfig.settings) { // Ensure settings object exists
        switch (lastConfig.functionType) {
          case 'from_signals':
            setSignalSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_signals,
              init_cash: lastConfig.settings.from_signals?.init_cash ?? initCash, // Ensure init_cash is loaded
            }));
            break;
          case 'from_order_func':
            setOrderFuncSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_order_func,
              init_cash: lastConfig.settings.from_order_func?.init_cash ?? initCash,
            }));
            break;
          case 'from_orders':
            setOrderSettings(prev => ({
              ...prev,
              ...lastConfig.settings.from_orders,
              init_cash: lastConfig.settings.from_orders?.init_cash ?? initCash,
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

    const datasetPaths = selectedDataset ? [selectedDataset] : [];

    const config = {
      datasetPaths,
      functionType: selectedFunction,
      settings: {
        from_signals: signalSettings,
        from_order_func: orderFuncSettings,
        from_orders: orderSettings
      },
      env: envObject
    };

    VSCodeAPI.postMessage({
      type: 'runBacktest',
      config,
    });
  };

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

      <DatasetSelector
        currentProject={currentProject}
        datasets={datasets}
        selectedDataset={selectedDataset}
        setSelectedDataset={setSelectedDataset}
      />

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
        <FromSignalsSettings
          signalSettings={signalSettings}
          setSignalSettings={setSignalSettings}
          initCash={initCash}
        />
      ) : selectedFunction === 'from_orders' ? (
        <FromOrdersSettings
          orderSettings={orderSettings}
          setOrderSettings={setOrderSettings}
          initCash={initCash}
        />
      ) : (
        <FromOrderFuncSettings
          orderFuncSettings={orderFuncSettings}
          setOrderFuncSettings={setOrderFuncSettings}
          initCash={initCash}
        />
      )}

      {/* Environment Variables Section */}
      <EnvironmentVariables
        envVariables={envVariables}
        addEnvVariable={addEnvVariable}
        removeEnvVariable={removeEnvVariable}
        updateEnvVariable={updateEnvVariable}
      />

      {/* Run Button */}
      <div>
        {/* <button
          onClick={handleRunBacktest}
          className="w-full text-sm text-[var(--vscode-button-foreground)] bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-3 font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:from-blue-500 hover:to-purple-500 active:scale-[0.98] active:shadow-md"
        ></button> */}
        <button
          onClick={handleRunBacktest}
          className="w-full text-sm text-[var(--vscode-button-foreground)] bg-[var(--vscode-button-background)] rounded px-4 py-2 hover:bg-[var(--vscode-button-hoverBackground)]"
        >
          Run Backtest
        </button>
      </div>
    </div>
  );
};

export default VectorBTSettingView;