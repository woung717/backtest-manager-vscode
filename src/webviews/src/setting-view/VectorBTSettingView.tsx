import React, { useState } from 'react';
import VSCodeAPI from '../../lib/VSCodeAPI';
import { ProjectInfo, DatasetInfo } from '../../../types';

type VectorBTSettingViewProps = {
  currentProject?: ProjectInfo;
  datasets?: DatasetInfo[];
  lastConfig?: any;
};

const VectorBTSettingView: React.FC<VectorBTSettingViewProps> = ({ currentProject, datasets = [], lastConfig }) => {
  const [backtestType, setBacktestType] = useState<'signals' | 'order_func'>('signals');
  
  // Common settings
  const [commonSettings, setCommonSettings] = useState({
    initCash: 100000,
    fees: 0.001,
    fixedFees: 0,
    freq: '1D',
    slippage: 0,
    size: 1.0,
    sizeType: 'amount', // 'amount', 'value', 'percent'
    minSize: null as number | null,
    maxSize: null as number | null,
    sizeGranularity: null as number | null,
    rejectProb: 0,
    lockCash: false,
    allowPartial: true,
    raiseReject: false,
    log: false,
    seed: null as number | null,
    groupBy: null as string | null,
    cashSharing: false,
    callSeq: 'auto',
    ffillValPrice: true,
    updateValue: true,
    maxOrders: null as number | null,
    maxLogs: null as number | null,
    broadcastNamedArgs: {} as Record<string, any>,
    broadcastKwargs: {} as Record<string, any>,
    templateMapping: {} as Record<string, any>,
    wrapperKwargs: {} as Record<string, any>,
    attachCallSeq: false
  });

  // Signal specific settings
  const [signalSettings, setSignalSettings] = useState({
    entries: true,
    exits: false,
    shortEntries: false,
    shortExits: false,
    signalFuncNb: null as string | null,
    signalArgs: [] as any[],
    direction: 'longonly', // 'longonly', 'shortonly', 'both'
    accumulate: 'disabled', // 'disabled', 'both', 'addonly'
    uponLongConflict: 'ignore', // ConflictMode
    uponShortConflict: 'ignore', // ConflictMode
    uponDirConflict: 'ignore', // DirectionConflictMode
    uponOppositeEntry: 'ignore', // OppositeEntryMode
    price: 'close', // 'open', 'high', 'low', 'close'
    valPrice: null as string | null,
    open: null as number | null,
    high: null as number | null,
    low: null as number | null,
    slStop: null as number | null,
    slTrail: false,
    tpStop: null as number | null,
    stopEntryPrice: 'close', // StopEntryPrice
    stopExitPrice: 'close', // StopExitPrice
    uponStopExit: 'close', // StopExitMode
    uponStopUpdate: 'override', // StopUpdateMode
    adjustSlFuncNb: null as string | null,
    adjustSlArgs: [] as any[],
    adjustTpFuncNb: null as string | null,
    adjustTpArgs: [] as any[],
    useStops: null as boolean | null
  });

  // Order function specific settings
  const [orderFuncSettings, setOrderFuncSettings] = useState({
    price: 'close',
    size: 1.0,
    fees: 0.001,
    slippage: 0,
    stopPrice: null as number | null,
    trailStopPrice: null as number | null,
    stopUpdatePrice: null as number | null,
    trailStopUpdatePrice: null as number | null,
  });

  // Dataset state management
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  
  // Environment variable state management
  const [envVariables, setEnvVariables] = useState<{
    id: string;
    key: string;
    value: string;
  }[]>([]);

  // Initialize settings based on last configuration
  React.useEffect(() => {
    if (lastConfig) {
      setBacktestType(lastConfig.type || 'signals');
      setCommonSettings(prev => ({ ...prev, ...lastConfig.common }));
      setSignalSettings(prev => ({ ...prev, ...lastConfig.signal }));
      setOrderFuncSettings(prev => ({ ...prev, ...lastConfig.orderFunc }));
      
      if (lastConfig.env && lastConfig.env.DATASET_PATH) {
        setSelectedDataset(lastConfig.env.DATASET_PATH);
      }
      
      if (lastConfig.env) {
        const envVars: { id: string; key: string; value: string }[] = [];
        Object.entries(lastConfig.env).forEach(([key, value]) => {
          if (key !== 'DATASET_PATH') {
            envVars.push({
              id: `env_${Date.now()}_${key}`,
              key,
              value: value as string
            });
          }
        });
        if (envVars.length > 0) {
          setEnvVariables(envVars);
        }
      }
    }
  }, [lastConfig]);

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

  const handleRunBacktest = () => {
    // Create environment variable object
    const envObject: Record<string, string> = {};
    envVariables.forEach(env => {
      if (env.key.trim()) {
        envObject[env.key.trim()] = env.value;
      }
    });

    // Add selected dataset to environment variables if present
    if (selectedDataset) {
      envObject['DATASET_PATH'] = selectedDataset;
    }

    const config = {
      type: backtestType,
      common: commonSettings,
      signal: signalSettings,
      orderFunc: orderFuncSettings,
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

      {/* Backtest Type Selection */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Backtest Type
          </label>
        </div>
        <select
          className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1"
          value={backtestType}
          onChange={(e) => setBacktestType(e.target.value as 'signals' | 'order_func')}
        >
          <option value="signals">from_signals()</option>
          <option value="order_func">from_order_func()</option>
        </select>
      </div>

      {/* Dataset Selection Section */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Select Dataset
          </label>
        </div>
        <div className="text-sm text-[var(--vscode-descriptionForeground)] mb-2">
          Select the dataset to use for backtesting. The selected dataset will be passed as the DATASET_PATH environment variable.
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
                <optgroup key={assetType} label={assetType.toUpperCase()}>
                  {datasets.map(dataset => (
                    <option 
                      key={dataset.path} 
                      value={dataset.path}
                    >
                      {dataset.symbol} - {dataset.timeframe} ({dataset.name})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Common Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Common Settings
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="initCash" className="text-sm">Initial Cash</label>
            <input
              type="number"
              id="initCash"
              value={commonSettings.initCash}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, initCash: parseFloat(e.target.value) }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fees" className="text-sm">Fees</label>
            <input
              type="number"
              id="fees"
              value={commonSettings.fees}
              step="0.001"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, fees: parseFloat(e.target.value) }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fixedFees" className="text-sm">Fixed Fees</label>
            <input
              type="number"
              id="fixedFees"
              value={commonSettings.fixedFees}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, fixedFees: parseFloat(e.target.value) }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="freq" className="text-sm">Frequency</label>
            <input
              type="text"
              id="freq"
              value={commonSettings.freq}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, freq: e.target.value }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slippage" className="text-sm">Slippage</label>
            <input
              type="number"
              id="slippage"
              value={commonSettings.slippage}
              step="0.001"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, slippage: parseFloat(e.target.value) }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sizeType" className="text-sm">Size Type</label>
            <select
              id="sizeType"
              value={commonSettings.sizeType}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, sizeType: e.target.value }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="amount">Amount</option>
              <option value="value">Value</option>
              <option value="percent">Percent</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="minSize" className="text-sm">Min Size</label>
            <input
              type="number"
              id="minSize"
              value={commonSettings.minSize || ''}
              step="0.1"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, minSize: e.target.value ? parseFloat(e.target.value) : null }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="maxSize" className="text-sm">Max Size</label>
            <input
              type="number"
              id="maxSize"
              value={commonSettings.maxSize || ''}
              step="0.1"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, maxSize: e.target.value ? parseFloat(e.target.value) : null }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="sizeGranularity" className="text-sm">Size Granularity</label>
            <input
              type="number"
              id="sizeGranularity"
              value={commonSettings.sizeGranularity || ''}
              step="0.01"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, sizeGranularity: e.target.value ? parseFloat(e.target.value) : null }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rejectProb" className="text-sm">Reject Probability</label>
            <input
              type="number"
              id="rejectProb"
              value={commonSettings.rejectProb}
              step="0.01"
              onChange={(e) => setCommonSettings(prev => ({ ...prev, rejectProb: parseFloat(e.target.value) }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lockCash" className="text-sm">Lock Cash</label>
            <input
              type="checkbox"
              id="lockCash"
              checked={commonSettings.lockCash}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, lockCash: e.target.checked }))}
              className="form-checkbox"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="allowPartial" className="text-sm">Allow Partial</label>
            <input
              type="checkbox"
              id="allowPartial"
              checked={commonSettings.allowPartial}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, allowPartial: e.target.checked }))}
              className="form-checkbox"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="raiseReject" className="text-sm">Raise Reject</label>
            <input
              type="checkbox"
              id="raiseReject"
              checked={commonSettings.raiseReject}
              onChange={(e) => setCommonSettings(prev => ({ ...prev, raiseReject: e.target.checked }))}
              className="form-checkbox"
            />
          </div>
        </div>
      </div>

      {/* Signal Settings */}
      {backtestType === 'signals' && (
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Signal Settings
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="entries" className="text-sm">Enable Long Entries</label>
              <input
                type="checkbox"
                id="entries"
                checked={signalSettings.entries}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, entries: e.target.checked }))}
                className="form-checkbox"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="exits" className="text-sm">Enable Long Exits</label>
              <input
                type="checkbox"
                id="exits"
                checked={signalSettings.exits}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, exits: e.target.checked }))}
                className="form-checkbox"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shortEntries" className="text-sm">Enable Short Entries</label>
              <input
                type="checkbox"
                id="shortEntries"
                checked={signalSettings.shortEntries}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, shortEntries: e.target.checked }))}
                className="form-checkbox"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shortExits" className="text-sm">Enable Short Exits</label>
              <input
                type="checkbox"
                id="shortExits"
                checked={signalSettings.shortExits}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, shortExits: e.target.checked }))}
                className="form-checkbox"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Direction Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="direction" className="text-sm">Direction</label>
                <select
                  id="direction"
                  value={signalSettings.direction}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="longonly">Long Only</option>
                  <option value="shortonly">Short Only</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Accumulate Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="accumulate" className="text-sm">Accumulate</label>
                <select
                  id="accumulate"
                  value={signalSettings.accumulate}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, accumulate: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="disabled">Disabled</option>
                  <option value="both">Both</option>
                  <option value="addonly">Add Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Conflict Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="uponLongConflict" className="text-sm">Upon Long Conflict</label>
                <select
                  id="uponLongConflict"
                  value={signalSettings.uponLongConflict}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, uponLongConflict: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="ignore">Ignore</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                  <option value="close">Close</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="uponShortConflict" className="text-sm">Upon Short Conflict</label>
                <select
                  id="uponShortConflict"
                  value={signalSettings.uponShortConflict}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, uponShortConflict: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="ignore">Ignore</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                  <option value="close">Close</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="uponDirConflict" className="text-sm">Upon Direction Conflict</label>
                <select
                  id="uponDirConflict"
                  value={signalSettings.uponDirConflict}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, uponDirConflict: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="ignore">Ignore</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                  <option value="close">Close</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Price Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="price" className="text-sm">Price</label>
                <select
                  id="price"
                  value={signalSettings.price}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="close">Close</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Val Price Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="valPrice" className="text-sm">Val Price</label>
                <input
                  type="text"
                  id="valPrice"
                  value={signalSettings.valPrice || ''}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, valPrice: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Stop Loss/Take Profit Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="slStop" className="text-sm">Stop Loss (%)</label>
                <input
                  type="number"
                  id="slStop"
                  value={signalSettings.slStop || ''}
                  step="0.01"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, slStop: e.target.value ? parseFloat(e.target.value) / 100 : null }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                  placeholder="Optional (e.g. 1 = 1%)"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="slTrail" className="text-sm">Trailing Stop Loss</label>
                <input
                  type="checkbox"
                  id="slTrail"
                  checked={signalSettings.slTrail}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, slTrail: e.target.checked }))}
                  className="form-checkbox"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="tpStop" className="text-sm">Take Profit (%)</label>
                <input
                  type="number"
                  id="tpStop"
                  value={signalSettings.tpStop || ''}
                  step="0.01"
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, tpStop: e.target.value ? parseFloat(e.target.value) / 100 : null }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                  placeholder="Optional (e.g. 1 = 1%)"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="useStops" className="text-sm">Use Stops</label>
                <select
                  id="useStops"
                  value={signalSettings.useStops === null ? '' : signalSettings.useStops.toString()}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, useStops: e.target.value === '' ? null : e.target.value === 'true' }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="">Auto</option>
                  <option value="true">Enable</option>
                  <option value="false">Disable</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Stop Entry Price Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="stopEntryPrice" className="text-sm">Stop Entry Price</label>
                <select
                  id="stopEntryPrice"
                  value={signalSettings.stopEntryPrice}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, stopEntryPrice: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="close">Close</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Stop Exit Price Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="stopExitPrice" className="text-sm">Stop Exit Price</label>
                <select
                  id="stopExitPrice"
                  value={signalSettings.stopExitPrice}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, stopExitPrice: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="close">Close</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Stop Update Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="uponStopExit" className="text-sm">Upon Stop Exit</label>
                <select
                  id="uponStopExit"
                  value={signalSettings.uponStopExit}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, uponStopExit: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="close">Close</option>
                  <option value="override">Override</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-bold text-[var(--vscode-input-foreground)] mb-2">Stop Update Settings</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="uponStopUpdate" className="text-sm">Upon Stop Update</label>
                <select
                  id="uponStopUpdate"
                  value={signalSettings.uponStopUpdate}
                  onChange={(e) => setSignalSettings(prev => ({ ...prev, uponStopUpdate: e.target.value }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                >
                  <option value="override">Override</option>
                  <option value="ignore">Ignore</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Function Settings */}
      {backtestType === 'order_func' && (
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Order Function Settings
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="price" className="text-sm">Price</label>
              <select
                id="price"
                value={orderFuncSettings.price}
                onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, price: e.target.value }))}
                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              >
                <option value="open">Open</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="close">Close</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="size" className="text-sm">Size</label>
              <input
                type="number"
                id="size"
                value={orderFuncSettings.size}
                step="0.1"
                onChange={(e) => setOrderFuncSettings(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables */}
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
        disabled={!currentProject}
        className="w-full bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-2 px-4 rounded hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        Run Backtest
      </button>
    </div>
  );
};

export default VectorBTSettingView;
