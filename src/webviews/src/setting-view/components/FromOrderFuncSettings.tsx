import React from 'react';
import { VectorBTFromOrderFuncSettings } from '../../../../engines/vectorbt/types';

type FromOrderFuncSettingsProps = {
  orderFuncSettings: VectorBTFromOrderFuncSettings;
  setOrderFuncSettings: React.Dispatch<React.SetStateAction<VectorBTFromOrderFuncSettings>>;
  initCash: number;
};

export const FromOrderFuncSettings: React.FC<FromOrderFuncSettingsProps> = ({
  orderFuncSettings,
  setOrderFuncSettings,
  initCash,
}) => {
  return (
    <div className="space-y-3">
      {/* Trading */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Trading
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="init_cash_order_func" className="text-sm">Initial Cash</label>
            <input
              type="number"
              id="init_cash_order_func"
              value={orderFuncSettings.init_cash}
              min="0"
              step="1"
              onChange={(e) =>
                setOrderFuncSettings(prev => ({ ...prev, init_cash: e.target.value ? parseFloat(e.target.value) : initCash }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.flexible}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, flexible: e.target.checked }))
                }
                className="mr-2"
              />
              Flexible Order Function
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="max_orders_order_func" className="text-sm">Max Orders</label>
            <input
              type="number"
              id="max_orders_order_func"
              value={orderFuncSettings.max_orders}
              min="0"
              onChange={(e) =>
                setOrderFuncSettings(prev => ({ ...prev, max_orders: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Performance
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.row_wise}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, row_wise: e.target.checked }))
                }
                className="mr-2"
              />
              Row-wise Processing
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.use_numba}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, use_numba: e.target.checked }))
                }
                className="mr-2"
              />
              Use Numba
            </label>
          </div>
        </div>
      </div>

      {/* Size & Cash */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Size & Cash</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.cash_sharing}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))
                }
                className="mr-2"
              />
              Cash Sharing
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.update_value}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, update_value: e.target.checked }))
                }
                className="mr-2"
              />
              Update Value
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.ffill_val_price}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, ffill_val_price: e.target.checked }))
                }
                className="mr-2"
              />
              Forward-fill Value Price
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.fill_pos_record}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, fill_pos_record: e.target.checked }))
                }
                className="mr-2"
              />
              Fill Position Record
            </label>
          </div>
        </div>
      </div>

      {/* Segment */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Segment
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.call_pre_segment}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, call_pre_segment: e.target.checked }))
                }
                className="mr-2"
              />
              Call Pre-Segment
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={orderFuncSettings.call_post_segment}
                onChange={(e) =>
                  setOrderFuncSettings(prev => ({ ...prev, call_post_segment: e.target.checked }))
                }
                className="mr-2"
              />
              Call Post-Segment
            </label>
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="space-y-1 pb-4">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
            Advanced
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="seed_order_func" className="text-sm">Seed</label>
            <input
              type="number"
              id="seed_order_func"
              value={orderFuncSettings.seed}
              onChange={(e) =>
                setOrderFuncSettings(prev => ({ ...prev, seed: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="max_logs_order_func" className="text-sm">Max Logs</label>
            <input
              type="number"
              id="max_logs_order_func"
              value={orderFuncSettings.max_logs}
              min="0"
              onChange={(e) =>
                setOrderFuncSettings(prev => ({ ...prev, max_logs: e.target.value ? parseInt(e.target.value) : undefined }))
              }
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
