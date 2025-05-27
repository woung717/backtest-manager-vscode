import React from 'react';
import { VectorBTFromOrdersSettings } from '../../../../engines/vectorbt/types';


interface FromOrdersSettingsProps {
  orderSettings: VectorBTFromOrdersSettings;
  setOrderSettings: React.Dispatch<React.SetStateAction<VectorBTFromOrdersSettings>>;
  initCash: number;
}

export const FromOrdersSettings: React.FC<FromOrdersSettingsProps> = ({
  orderSettings,
  setOrderSettings,
  initCash,
}) => {
  return (
    <div className="space-y-3">
      {/* Trading Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Trading
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="init_cash_orders" className="text-sm">Initial Cash</label>
            <input
              type="number"
              id="init_cash_orders"
              value={orderSettings.init_cash}
              min="0"
              step="1"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, init_cash: e.target.value ? parseFloat(e.target.value) : initCash }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="direction_orders" className="text-sm">Direction</label>
            <select
              id="direction_orders"
              value={orderSettings.direction}
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, direction: e.target.value as 'both' | 'longonly' | 'shortonly' }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="both">Both</option>
              <option value="longonly">Long Only</option>
              <option value="shortonly">Short Only</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="max_orders_orders" className="text-sm">Max Orders</label>
            <input
              type="number"
              id="max_orders_orders"
              value={orderSettings.max_orders}
              min="0"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, max_orders: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="reject_prob_orders" className="text-sm">Reject Probability</label>
            <input
              type="number"
              id="reject_prob_orders"
              value={orderSettings.reject_prob}
              min="0"
              max="1"
              step="0.01"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, reject_prob: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.lock_cash}
                onChange={e => setOrderSettings(prev => ({ ...prev, lock_cash: e.target.checked }))}
                className="mr-2"
              />
              Lock Cash
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.cash_sharing}
                onChange={e => setOrderSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))}
                className="mr-2"
              />
              Cash Sharing
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.update_value}
                onChange={e => setOrderSettings(prev => ({ ...prev, update_value: e.target.checked }))}
                className="mr-2"
              />
              Update Value
            </label>
          </div>
        </div>
      </div>

      {/* Size Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Sizing
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="size_orders" className="text-sm">Size</label>
            <input
              type="number"
              id="size_orders"
              value={orderSettings.size}
              min="0"
              step="0.1"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, size: e.target.value ? parseFloat(e.target.value) : 1.0 }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="size_type_orders" className="text-sm">Size Type</label>
            <select
              id="size_type_orders"
              value={orderSettings.size_type}
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, size_type: e.target.value as 'Amount' | 'Value' | 'Percent' }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="Amount">Amount</option>
              <option value="Value">Value</option>
              <option value="Percent">Percent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="min_size_orders" className="text-sm">Min Size</label>
            <input
              type="number"
              id="min_size_orders"
              value={orderSettings.min_size}
              min="0"
              step="0.1"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, min_size: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="max_size_orders" className="text-sm">Max Size</label>
            <input
              type="number"
              id="max_size_orders"
              value={orderSettings.max_size}
              min="0"
              step="0.1"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, max_size: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="size_granularity_orders" className="text-sm">Size Granularity</label>
            <input
              type="number"
              id="size_granularity_orders"
              value={orderSettings.size_granularity}
              min="0"
              step="0.00000001"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, size_granularity: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Fees & Slippage
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label htmlFor="fees_orders" className="text-sm">Fees (%)</label>
            <input
              type="number"
              id="fees_orders"
              value={orderSettings.fees}
              min="0"
              step="0.01"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, fees: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fixed_fees_orders" className="text-sm">Fixed Fees</label>
            <input
              type="number"
              id="fixed_fees_orders"
              value={orderSettings.fixed_fees}
              min="0"
              step="0.01"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, fixed_fees: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slippage_orders" className="text-sm">Slippage (%)</label>
            <input
              type="number"
              id="slippage_orders"
              value={orderSettings.slippage}
              min="0"
              step="0.01"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, slippage: e.target.value ? parseFloat(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
      </div>

      {/* Price Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Price
          </label>
        </div>
        <div className="space-y-1 mt-2">
          <label className="text-sm flex items-center">
            <input
              type="checkbox"
              checked={orderSettings.ffill_val_price}
              onChange={e => setOrderSettings(prev => ({ ...prev, ffill_val_price: e.target.checked }))}
              className="mr-2"
            />
            Forward-fill Value Price
          </label>
        </div>
      </div>

      {/* Order Settings */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Order Settings
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.allow_partial}
                onChange={e => setOrderSettings(prev => ({ ...prev, allow_partial: e.target.checked }))}
                className="mr-2"
              />
              Allow Partial Fills
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.raise_reject}
                onChange={e => setOrderSettings(prev => ({ ...prev, raise_reject: e.target.checked }))}
                className="mr-2"
              />
              Raise on Reject
            </label>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <label className="text-sm flex items-center">
            <input
              type="checkbox"
              checked={orderSettings.log}
              onChange={e => setOrderSettings(prev => ({ ...prev, log: e.target.checked }))}
              className="mr-2"
            />
            Enable Logging
          </label>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-1 pb-4">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Advanced
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="seed_orders" className="text-sm">Seed</label>
            <input
              type="number"
              id="seed_orders"
              value={orderSettings.seed}
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, seed: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="max_logs_orders" className="text-sm">Max Logs</label>
            <input
              type="number"
              id="max_logs_orders"
              value={orderSettings.max_logs}
              min="0"
              onChange={(e) =>
                setOrderSettings(prev => ({ ...prev, max_logs: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="call_seq_orders" className="text-sm">Call Sequence</label>
            <select
              id="call_seq_orders"
              value={orderSettings.call_seq}
              onChange={(e) => setOrderSettings(prev => ({ ...prev, call_seq: e.target.value || undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="default">Default</option>
              <option value="reversed">Reversed</option>
              <option value="random">Random</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderSettings.attach_call_seq}
                onChange={e => setOrderSettings(prev => ({ ...prev, attach_call_seq: e.target.checked }))}
                className="mr-2"
              />
              Attach Call Sequence
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
