import React from 'react';
import { VectorBTFromSignalsSettings } from '../../../../engines/vectorbt/types';

type FromSignalsSettingsProps = {
  signalSettings: VectorBTFromSignalsSettings;
  setSignalSettings: React.Dispatch<React.SetStateAction<VectorBTFromSignalsSettings>>;
  initCash: number;
};

export const FromSignalsSettings: React.FC<FromSignalsSettingsProps> = ({
  signalSettings,
  setSignalSettings,
  initCash,
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Trading</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="init_cash_signal" className="text-sm">Initial Cash</label>
            <input
              type="number"
              id="init_cash_signal"
              value={signalSettings.init_cash}
              min="0"
              step="1"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, init_cash: e.target.value ? parseFloat(e.target.value) : initCash }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="direction_signal" className="text-sm">Direction</label>
            <select
              id="direction_signal"
              value={signalSettings.direction}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, direction: e.target.value ? e.target.value as 'both' | 'longonly' | 'shortonly' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Both</option>
              <option value="longonly">Long Only</option>
              <option value="shortonly">Short Only</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="max_orders_signal" className="text-sm">Max Orders</label>
            <input
              type="number"
              id="max_orders_signal"
              value={signalSettings.max_orders}
              min="0"
              onChange={e => setSignalSettings(prev => ({ ...prev, max_orders: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="reject_prob_signal" className="text-sm">Reject Probability</label>
            <input
              type="number"
              id="reject_prob_signal"
              value={signalSettings.reject_prob}
              min="0"
              max="1"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, reject_prob: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.lock_cash}
                onChange={e => setSignalSettings(prev => ({ ...prev, lock_cash: e.target.checked }))}
                className="mr-2"
              />
              Lock Cash
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.cash_sharing}
                onChange={e => setSignalSettings(prev => ({ ...prev, cash_sharing: e.target.checked }))}
                className="mr-2"
              />
              Cash Sharing
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.update_value}
                onChange={e => setSignalSettings(prev => ({ ...prev, update_value: e.target.checked }))}
                className="mr-2"
              />
              Update Value
            </label>
          </div>
        </div>
      </div>

      {/* Sizing */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Sizing</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="size_signal" className="text-sm">Size</label>
            <input
              type="number"
              id="size_signal"
              value={signalSettings.size}
              min="0"
              step="0.1"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, size: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="size_type_signal" className="text-sm">Size Type</label>
            <select
              id="size_type_signal"
              value={signalSettings.size_type}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, size_type: e.target.value as 'Amount' | 'Value' | 'Percent' }))}
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
            <label htmlFor="min_size_signal" className="text-sm">Min Size</label>
            <input
              type="number"
              id="min_size_signal"
              value={signalSettings.min_size}
              min="0"
              step="0.1"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, min_size: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full p-1 text-sm border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="max_size_signal" className="text-sm">Max Size</label>
            <input
              type="number"
              id="max_size_signal"
              value={signalSettings.max_size}
              min="0"
              step="0.1"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, max_size: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full p-1 text-sm border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="size_granularity_signal" className="text-sm">Size Granularity</label>
            <input
              type="number"
              id="size_granularity_signal"
              value={signalSettings.size_granularity}
              min="0"
              step="0.00000001"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, size_granularity: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full p-1 text-sm border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] rounded"
            />
          </div>
        </div>
      </div>

      {/* Fees & Slippage */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Fees & Slippage</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label htmlFor="fees_signal" className="text-sm">Fees (%)</label>
            <input
              type="number"
              id="fees_signal"
              value={signalSettings.fees}
              min="0"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, fees: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fixed_fees_signal" className="text-sm">Fixed Fees</label>
            <input
              type="number"
              id="fixed_fees_signal"
              value={signalSettings.fixed_fees}
              min="0"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, fixed_fees: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="slippage_signal" className="text-sm">Slippage (%)</label>
            <input
              type="number"
              id="slippage_signal"
              value={signalSettings.slippage}
              min="0"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, slippage: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
      </div>

      {/* Stops */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Stops</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="sl_stop_signal" className="text-sm">Stop Loss (%)</label>
            <input
              type="number"
              id="sl_stop_signal"
              value={signalSettings.sl_stop}
              min="0"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, sl_stop: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="tp_stop_signal" className="text-sm">Take Profit (%)</label>
            <input
              type="number"
              id="tp_stop_signal"
              value={signalSettings.tp_stop}
              min="0"
              step="0.01"
              onChange={(e) => setSignalSettings(prev => ({ ...prev, tp_stop: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="stop_entry_price_signal" className="text-sm">Stop Entry Price</label>
            <select
              id="stop_entry_price_signal"
              value={signalSettings.stop_entry_price}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, stop_entry_price: e.target.value ? e.target.value as 'close' | 'open' | 'high' | 'low' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="close">Close</option>
              <option value="open">Open</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="stop_exit_price_signal" className="text-sm">Stop Exit Price</label>
            <select
              id="stop_exit_price_signal"
              value={signalSettings.stop_exit_price}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, stop_exit_price: e.target.value ? e.target.value as 'close' | 'open' | 'high' | 'low' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="close">Close</option>
              <option value="open">Open</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="upon_stop_exit_signal" className="text-sm">Upon Stop Exit</label>
            <select
              id="upon_stop_exit_signal"
              value={signalSettings.upon_stop_exit || ''}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_stop_exit: e.target.value ? e.target.value as 'close' | 'close_reduce' | 'reverse' | 'reverse_reduce' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="close">Close</option>
              <option value="close_reduce">Close Reduce</option>
              <option value="reverse">Reverse</option>
              <option value="reverse_reduce">Reverse Reduce</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="upon_stop_update_signal" className="text-sm">Upon Stop Update</label>
            <select
              id="upon_stop_update_signal"
              value={signalSettings.upon_stop_update}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_stop_update: e.target.value ? e.target.value as 'keep' | 'override' | 'override_nan' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="keep">Keep</option>
              <option value="override">Override</option>
              <option value="override_nan">Override NaN</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.sl_trail}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, sl_trail: e.target.checked }))}
                className="mr-2"
              />
              Trailing Stop Loss
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.use_stops}
                onChange={(e) => setSignalSettings(prev => ({ ...prev, use_stops: e.target.checked }))}
                className="mr-2"
              />
              Use Stops
            </label>
          </div>
        </div>
      </div>

      {/* Conflicts */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Conflicts</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="upon_long_conflict_signal" className="text-sm">Upon Long Conflict</label>
            <select
              id="upon_long_conflict_signal"
              value={signalSettings.upon_long_conflict}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_long_conflict: e.target.value ? e.target.value as 'ignore' | 'entry' | 'exit' | 'adjacent' | 'opposite' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="ignore">Ignore</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="adjacent">Adjacent</option>
              <option value="opposite">Opposite</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="upon_short_conflict_signal" className="text-sm">Upon Short Conflict</label>
            <select
              id="upon_short_conflict_signal"
              value={signalSettings.upon_short_conflict}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_short_conflict: e.target.value ? e.target.value as 'ignore' | 'entry' | 'exit' | 'adjacent' | 'opposite' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="ignore">Ignore</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="adjacent">Adjacent</option>
              <option value="opposite">Opposite</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label htmlFor="upon_dir_conflict_signal" className="text-sm">Upon Direction Conflict</label>
            <select
              id="upon_dir_conflict_signal"
              value={signalSettings.upon_dir_conflict}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_dir_conflict: e.target.value ? e.target.value as 'ignore' | 'long' | 'short' | 'adjacent' | 'opposite' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="ignore">Ignore</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
              <option value="adjacent">Adjacent</option>
              <option value="opposite">Opposite</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="upon_opposite_entry_signal" className="text-sm">Upon Opposite Entry</label>
            <select
              id="upon_opposite_entry_signal"
              value={signalSettings.upon_opposite_entry}
              onChange={(e) => setSignalSettings(prev => ({ ...prev, upon_opposite_entry: e.target.value ? e.target.value as 'ignore' | 'close' | 'close_reduce' | 'reverse' | 'reverse_reduce' : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            >
              <option value="">Default</option>
              <option value="ignore">Ignore</option>
              <option value="close">Close</option>
              <option value="close_reduce">Close Reduce</option>
              <option value="reverse">Reverse</option>
              <option value="reverse_reduce">Reverse Reduce</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.allow_partial}
                onChange={e => setSignalSettings(prev => ({ ...prev, allow_partial: e.target.checked }))}
                className="mr-2"
              />
              Allow Partial Fills
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.raise_reject}
                onChange={e => setSignalSettings(prev => ({ ...prev, raise_reject: e.target.checked }))}
                className="mr-2"
              />
              Raise on Reject
            </label>
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
        <div className="mb-1">
          <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">Advanced</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="max_logs_signal" className="text-sm">Max Logs</label>
            <input
              type="number"
              id="max_logs_signal"
              value={signalSettings.max_logs}
              min="0"
              onChange={e => setSignalSettings(prev => ({ ...prev, max_logs: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="seed_signal" className="text-sm">Seed</label>
            <input
              type="number"
              id="seed_signal"
              value={signalSettings.seed}
              onChange={e => setSignalSettings(prev => ({ ...prev, seed: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.attach_call_seq}
                onChange={e => setSignalSettings(prev => ({ ...prev, attach_call_seq: e.target.checked }))}
                className="mr-2"
              />
              Attach Call Sequence
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.log}
                onChange={e => setSignalSettings(prev => ({ ...prev, log: e.target.checked }))}
                className="mr-2"
              />
              Enable Logging
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.accumulate}
                onChange={e => setSignalSettings(prev => ({ ...prev, accumulate: e.target.checked }))}
                className="mr-2"
              />
              Accumulate Positions
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm flex items-center">
              <input
                type="checkbox"
                checked={signalSettings.ffill_val_price}
                onChange={e => setSignalSettings(prev => ({ ...prev, ffill_val_price: e.target.checked }))}
                className="mr-2"
              />
              Forward-fill Value Price
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
