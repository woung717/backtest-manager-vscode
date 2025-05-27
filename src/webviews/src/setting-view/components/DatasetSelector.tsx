import React from 'react';
import { DatasetInfo, ProjectInfo } from '../../../../types';
import VSCodeAPI from '../../../lib/VSCodeAPI';

type DatasetSelectorProps = {
  currentProject?: ProjectInfo;
  datasets: DatasetInfo[];
  selectedDataset: string | null;
  setSelectedDataset: (dataset: string | null) => void;
};

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  currentProject,
  datasets = [],
  selectedDataset,
  setSelectedDataset,
}) => {
  // Group datasets by asset type
  const groupedDatasets = datasets.reduce((acc, dataset) => {
    if (!acc[dataset.assetType]) {
      acc[dataset.assetType] = [];
    }
    acc[dataset.assetType].push(dataset);
    return acc;
  }, {} as Record<string, DatasetInfo[]>);

  return (
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
  );
};

export default DatasetSelector;
