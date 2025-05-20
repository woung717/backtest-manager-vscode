import React, { useState } from 'react';
import VSCodeAPI from '../../lib/VSCodeAPI';
import { ProjectInfo, DatasetInfo } from '../../../types';

type BacktradrSettingViewProps = {
  currentProject?: ProjectInfo;
  datasets?: DatasetInfo[];
  lastConfig?: any;
};

const BacktraderSettingView: React.FC<BacktradrSettingViewProps> = ({ currentProject, datasets = [], lastConfig }) => {
  const [cerebroSettings, setCerebroSettings] = useState({
    preload: true,
    runonce: true,
    live: false,
    maxcpus: undefined as number | undefined,
    stdstats: true,
    oldbuysell: false,
    oldtrades: false,
    exactbars: false as boolean | number,
    plotEnabled: false,
  });

  const [brokerSettings, setBrokerSettings] = useState({
    initialCapital: 10000,
    checkSubmit: true,
    eosbar: false,
    coc: false,
    coo: false,
    int2pnl: true,
    shortcash: true,
    fundstartval: 100,
    fundmode: false,
  });

  const [commissionSettings, setCommissionSettings] = useState({
    commission: 0,
    margin: 0,
    mult: 1.0,
    percabs: true,
    stocklike: true,
    interest: 0,
    interestLong: false,
    leverage: 1.0,
    automargin: false,
  });

  const [slippageSettings, setSlippageSettings] = useState({
    slippagePerc: 0,
    slippageFixed: 0,
    slippageOpen: false,
    slippageLimit: true,
    slippageMatch: true,
    slippageOut: false,
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
      // Cerebro settings
      if (lastConfig.preload !== undefined) setCerebroSettings(prev => ({ ...prev, preload: lastConfig.preload }));
      if (lastConfig.runonce !== undefined) setCerebroSettings(prev => ({ ...prev, runonce: lastConfig.runonce }));
      if (lastConfig.live !== undefined) setCerebroSettings(prev => ({ ...prev, live: lastConfig.live }));
      if (lastConfig.maxcpus !== undefined) setCerebroSettings(prev => ({ ...prev, maxcpus: lastConfig.maxcpus }));
      if (lastConfig.stdstats !== undefined) setCerebroSettings(prev => ({ ...prev, stdstats: lastConfig.stdstats }));
      if (lastConfig.oldbuysell !== undefined) setCerebroSettings(prev => ({ ...prev, oldbuysell: lastConfig.oldbuysell }));
      if (lastConfig.oldtrades !== undefined) setCerebroSettings(prev => ({ ...prev, oldtrades: lastConfig.oldtrades }));
      if (lastConfig.exactbars !== undefined) setCerebroSettings(prev => ({ ...prev, exactbars: lastConfig.exactbars }));
      if (lastConfig.plotEnabled !== undefined) setCerebroSettings(prev => ({ ...prev, plotEnabled: lastConfig.plotEnabled }));
      
      // Broker settings
      if (lastConfig.broker) {
        const broker = lastConfig.broker;
        if (broker.initialCapital !== undefined) setBrokerSettings(prev => ({ ...prev, initialCapital: broker.initialCapital }));
        if (broker.checkSubmit !== undefined) setBrokerSettings(prev => ({ ...prev, checkSubmit: broker.checkSubmit }));
        if (broker.eosbar !== undefined) setBrokerSettings(prev => ({ ...prev, eosbar: broker.eosbar }));
        if (broker.coc !== undefined) setBrokerSettings(prev => ({ ...prev, coc: broker.coc }));
        if (broker.coo !== undefined) setBrokerSettings(prev => ({ ...prev, coo: broker.coo }));
        if (broker.int2pnl !== undefined) setBrokerSettings(prev => ({ ...prev, int2pnl: broker.int2pnl }));
        if (broker.shortcash !== undefined) setBrokerSettings(prev => ({ ...prev, shortcash: broker.shortcash }));
        if (broker.fundstartval !== undefined) setBrokerSettings(prev => ({ ...prev, fundstartval: broker.fundstartval }));
        if (broker.fundmode !== undefined) setBrokerSettings(prev => ({ ...prev, fundmode: broker.fundmode }));
        
        // Commission settings
        if (broker.commissionScheme) {
          const commission = broker.commissionScheme;
          if (commission.commission !== undefined) setCommissionSettings(prev => ({ ...prev, commission: commission.commission }));
          if (commission.margin !== undefined) setCommissionSettings(prev => ({ ...prev, margin: commission.margin }));
          if (commission.mult !== undefined) setCommissionSettings(prev => ({ ...prev, mult: commission.mult }));
          if (commission.percabs !== undefined) setCommissionSettings(prev => ({ ...prev, percabs: commission.percabs }));
          if (commission.stocklike !== undefined) setCommissionSettings(prev => ({ ...prev, stocklike: commission.stocklike }));
          if (commission.interest !== undefined) setCommissionSettings(prev => ({ ...prev, interest: commission.interest }));
          if (commission.interestLong !== undefined) setCommissionSettings(prev => ({ ...prev, interestLong: commission.interestLong }));
          if (commission.leverage !== undefined) setCommissionSettings(prev => ({ ...prev, leverage: commission.leverage }));
          if (commission.automargin !== undefined) setCommissionSettings(prev => ({ ...prev, automargin: commission.automargin }));
        }
        
        // Slippage settings
        if (broker.slippage) {
          const slippage = broker.slippage;
          if (slippage.slippagePerc !== undefined) setSlippageSettings(prev => ({ ...prev, slippagePerc: slippage.slippagePerc }));
          if (slippage.slippageFixed !== undefined) setSlippageSettings(prev => ({ ...prev, slippageFixed: slippage.slippageFixed }));
          if (slippage.slippageOpen !== undefined) setSlippageSettings(prev => ({ ...prev, slippageOpen: slippage.slippageOpen }));
          if (slippage.slippageLimit !== undefined) setSlippageSettings(prev => ({ ...prev, slippageLimit: slippage.slippageLimit }));
          if (slippage.slippageMatch !== undefined) setSlippageSettings(prev => ({ ...prev, slippageMatch: slippage.slippageMatch }));
          if (slippage.slippageOut !== undefined) setSlippageSettings(prev => ({ ...prev, slippageOut: slippage.slippageOut }));
        }
      }
      
      // Dataset selection
      if (lastConfig.env && lastConfig.env.DATASET_PATH) {
        setSelectedDataset(lastConfig.env.DATASET_PATH);
      }
      
      // Environment variable settings
      if (lastConfig.env) {
        const envVars: { id: string; key: string; value: string }[] = [];
        Object.entries(lastConfig.env).forEach(([key, value]) => {
          if (key !== 'DATASET_PATH') { // DATASET_PATH is handled separately
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
  }, [lastConfig, currentProject]);
  
  const addEnvVariable = () => {
    const newId = `env_${Date.now()}`;
    setEnvVariables([...envVariables, { id: newId, key: '', value: '' }]);
  };
  
  const removeEnvVariable = (id: string) => {
    setEnvVariables(envVariables.filter(env => env.id !== id));
  };
  
  const updateEnvVariable = (id: string, field: 'key' | 'value', newValue: string) => {
    setEnvVariables(
      envVariables.map(env => 
        env.id === id ? { ...env, [field]: newValue } : env
      )
    );
  };

  const handleRunBacktest = () => {
    const envObject: Record<string, string> = {};
    envVariables.forEach(env => {
      if (env.key.trim()) {
        envObject[env.key.trim()] = env.value;
      }
    });

    const datasetPath = selectedDataset || '';
    
    if (datasetPath) {
      envObject['DATASET_PATH'] = datasetPath;
    }

    const config = {
      ...cerebroSettings,
      broker: {
        ...brokerSettings,
        commissionScheme: {
          ...commissionSettings,
          commission: commissionSettings.commission,
          margin: commissionSettings.margin,
          interest: commissionSettings.interest,
        },
        slippage: slippageSettings,
      },
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

      <div className="space-y-3">
        {/* Cerebro Settings */}
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Cerebro Settings
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Load data into memory before running the backtest">
              <input
                type="checkbox"
                checked={cerebroSettings.preload}
                onChange={(e) => setCerebroSettings(prev => ({ ...prev, preload: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Preload Data</span>
            </label>
            <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Run indicators in vectorized mode for better performance">
              <input
                type="checkbox"
                checked={cerebroSettings.runonce}
                onChange={(e) => setCerebroSettings(prev => ({ ...prev, runonce: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Run Once</span>
            </label>
            <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Enable live trading mode">
              <input
                type="checkbox"
                checked={cerebroSettings.live}
                onChange={(e) => setCerebroSettings(prev => ({ ...prev, live: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Live Mode</span>
            </label>
            <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Add default observers (cash, value, trades)">
              <input
                type="checkbox"
                checked={cerebroSettings.stdstats}
                onChange={(e) => setCerebroSettings(prev => ({ ...prev, stdstats: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Standard Stats</span>
            </label>
            <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Enable plotting after backtest completion">
              <input
                type="checkbox"
                checked={cerebroSettings.plotEnabled}
                onChange={(e) => setCerebroSettings(prev => ({ ...prev, plotEnabled: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Enable Plot</span>
            </label>
          </div>
          
          {/* Additional items collapse/expand */}
          <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer hover:text-[var(--vscode-textLink-foreground)]">Advanced Settings</summary>
              <div className="mt-2 pl-2">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Use old style buy/sell plotting">
                    <input
                      type="checkbox"
                      checked={cerebroSettings.oldbuysell}
                      onChange={(e) => setCerebroSettings(prev => ({ ...prev, oldbuysell: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>Old Buy/Sell</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Use old style trade plotting">
                    <input
                      type="checkbox"
                      checked={cerebroSettings.oldtrades}
                      onChange={(e) => setCerebroSettings(prev => ({ ...prev, oldtrades: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>Old Trades</span>
                  </label>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="maxcpus" className="text-sm" title="Number of CPU cores to use for optimization">Max CPUs</label>
                      <input
                        type="number"
                        id="maxcpus"
                        min="1"
                        value={cerebroSettings.maxcpus}
                        onChange={(e) => setCerebroSettings(prev => ({ ...prev, maxcpus: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="exactbars" className="text-sm" title="Memory optimization setting for bar management">Exact Bars</label>
                      <select
                        id="exactbars"
                        value={String(cerebroSettings.exactbars)}
                        onChange={(e) => {
                          const value = e.target.value;
                          let exactbars: boolean | number;
                          if (value === 'true') exactbars = true;
                          else if (value === 'false') exactbars = false;
                          else exactbars = parseInt(value);
                          setCerebroSettings(prev => ({ ...prev, exactbars }));
                        }}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      >
                        <option value="false">False</option>
                        <option value="true">True</option>
                        <option value="-1">-1</option>
                        <option value="-2">-2</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Broker Settings */}
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Broker Settings
            </label>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="initialCapital" className="text-sm" title="Initial cash amount for the backtest">Cash</label>
                <input
                  type="number"
                  id="initialCapital"
                  value={brokerSettings.initialCapital}
                  min="0"
                  step="1000"
                  onChange={(e) => setBrokerSettings(prev => ({ ...prev, initialCapital: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Check margin/cash before accepting an order">
                <input
                  type="checkbox"
                  checked={brokerSettings.checkSubmit}
                  onChange={(e) => setBrokerSettings(prev => ({ ...prev, checkSubmit: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Check Margin</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Match market orders to the closing price of the bar">
                <input
                  type="checkbox"
                  checked={brokerSettings.coc}
                  onChange={(e) => setBrokerSettings(prev => ({ ...prev, coc: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Cheat-On-Close</span>
              </label>
            </div>
            
            {/* Broker advanced settings */}
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-[var(--vscode-textLink-foreground)]">Advanced Settings</summary>
                <div className="mt-2 pl-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Consider a bar with same time as session end to be end of session">
                      <input
                        type="checkbox"
                        checked={brokerSettings.eosbar}
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, eosbar: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>EOS Bar</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Match market orders to the opening price before broker evaluation">
                      <input
                        type="checkbox"
                        checked={brokerSettings.coo}
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, coo: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Cheat-On-Open</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Include interest in profit/loss calculations">
                      <input
                        type="checkbox"
                        checked={brokerSettings.int2pnl}
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, int2pnl: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Interest to PnL</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Increase cash when shorting stocklike assets">
                      <input
                        type="checkbox"
                        checked={brokerSettings.shortcash}
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, shortcash: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Short Cash</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Enable fund-like performance tracking">
                      <input
                        type="checkbox"
                        checked={brokerSettings.fundmode}
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, fundmode: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Fund Mode</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="fundstartval" className="text-sm" title="Starting value for fund-like performance measurement">Fund Start Value</label>
                      <input
                        type="number"
                        id="fundstartval"
                        value={brokerSettings.fundstartval}
                        min="0"
                        step="0.1"
                        onChange={(e) => setBrokerSettings(prev => ({ ...prev, fundstartval: parseFloat(e.target.value) }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Commission Settings
            </label>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="commission" className="text-sm" title="Commission rate for specific commission scheme">Commission Rate</label>
                <input
                  type="number"
                  id="commission"
                  value={commissionSettings.commission}
                  min="0"
                  max="100"
                  step="0.001"
                  onChange={(e) => setCommissionSettings(prev => ({ ...prev, commission: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            
            {/* Commission advanced settings */}
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-[var(--vscode-textLink-foreground)]">Advanced Settings</summary>
                <div className="mt-2 pl-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="margin" className="text-sm" title="Required margin percentage for trades">Margin</label>
                      <input
                        type="number"
                        id="margin"
                        value={commissionSettings.margin}
                        min="0"
                        max="100"
                        step="1"
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, margin: parseFloat(e.target.value) }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="mult" className="text-sm" title="Multiplier for position sizing">Multiplier</label>
                      <input
                        type="number"
                        id="mult"
                        value={commissionSettings.mult}
                        min="0"
                        step="0.1"
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, mult: parseFloat(e.target.value) }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Use absolute percentage values for commission calculation">
                      <input
                        type="checkbox"
                        checked={commissionSettings.percabs}
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, percabs: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Percentage Absolute</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Treat the asset as stock-like (spot) trading">
                      <input
                        type="checkbox"
                        checked={commissionSettings.stocklike}
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, stocklike: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Stock-like</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Apply interest to long positions">
                      <input
                        type="checkbox"
                        checked={commissionSettings.interestLong}
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, interestLong: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Interest Long</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Calculate margin automatically">
                      <input
                        type="checkbox"
                        checked={commissionSettings.automargin}
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, automargin: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Auto Margin</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="interest" className="text-sm" title="Interest rate for margin positions">Interest Rate</label>
                      <input
                        type="number"
                        id="interest"
                        value={commissionSettings.interest}
                        min="0"
                        step="0.1"
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, interest: parseFloat(e.target.value) }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="leverage" className="text-sm" title="Leverage multiplier for trades">Leverage</label>
                      <input
                        type="number"
                        id="leverage"
                        value={commissionSettings.leverage}
                        min="1"
                        step="0.1"
                        onChange={(e) => setCommissionSettings(prev => ({ ...prev, leverage: parseFloat(e.target.value) }))}
                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
          <div className="mb-1">
            <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
              Slippage Settings
            </label>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="slippagePerc" className="text-sm" title="Percentage to slip prices up/down for buy/sell orders (0.01 = 1%)">Slip Percentage</label>
                <input
                  type="number"
                  id="slippagePerc"
                  value={slippageSettings.slippagePerc}
                  min="0"
                  step="0.001"
                  onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippagePerc: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="slippageFixed" className="text-sm" title="Fixed amount to slip prices up/down for buy/sell orders">Slip Fixed</label>
                <input
                  type="number"
                  id="slippageFixed"
                  value={slippageSettings.slippageFixed}
                  min="0"
                  step="0.01"
                  onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippageFixed: parseFloat(e.target.value) }))}
                  className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
                />
              </div>
            </div>
            
            {/* Slippage advanced settings */}
            <div className="mt-2">
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-[var(--vscode-textLink-foreground)]">Advanced Settings</summary>
                <div className="mt-2 pl-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Apply slippage to opening price orders">
                      <input
                        type="checkbox"
                        checked={slippageSettings.slippageOpen}
                        onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippageOpen: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Slip Open</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Cap slippage at high/low prices">
                      <input
                        type="checkbox"
                        checked={slippageSettings.slippageMatch}
                        onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippageMatch: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Slip Match</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Match limit orders even if slip_match is False">
                      <input
                        type="checkbox"
                        checked={slippageSettings.slippageLimit}
                        onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippageLimit: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Slip Limit</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer" title="Allow slippage outside high-low range">
                      <input
                        type="checkbox"
                        checked={slippageSettings.slippageOut}
                        onChange={(e) => setSlippageSettings(prev => ({ ...prev, slippageOut: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Slip Out</span>
                    </label>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

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
          disabled={!currentProject}
          className="w-full bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-2 px-4 rounded hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Run Backtest
        </button>
      </div>
    </div>
  );
};

export default BacktraderSettingView; 