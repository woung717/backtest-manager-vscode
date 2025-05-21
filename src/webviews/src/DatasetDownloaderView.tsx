import React, { useState, useEffect, useRef } from 'react';
import VSCodeAPI from '../lib/VSCodeAPI';

type DatasetDownloaderProps = {
  assetType?: 'crypto' | 'stock' | 'forex';
};

const DatasetDownloaderView: React.FC<DatasetDownloaderProps> = ({ assetType = 'crypto' }) => {
  const defaultExchange = 'coinbase';
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  // Form state
  const [exchange, setExchange] = useState('');
  const [symbol, setSymbol] = useState('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExchanges, setIsLoadingExchanges] = useState(false);
  const [showSymbolList, setShowSymbolList] = useState(false);
  
  // Available symbols and timeframes per exchange
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [availableTimeframes, setAvailableTimeframes] = useState<string[]>([]);
  const [availableExchanges, setAvailableExchanges] = useState<string[]>([]);

  // Filtered symbol list by search term
  const filteredSymbols = symbolSearch 
    ? availableSymbols.filter(s => s.toLowerCase().includes(symbolSearch.toLowerCase()))
    : availableSymbols;

  // Initial number of symbols to display
  const initialSymbolCount = 10;

  // Fetch exchange list from CCXT on initial load
  useEffect(() => {
    if (assetType) {
      fetchExchangeList();
    }
  }, [assetType]);
  
  // Fetch exchange list
  const fetchExchangeList = async () => {
    try {
      setIsLoadingExchanges(true);
      
      // Request exchange list from backend
      VSCodeAPI.postMessage({
        type: 'getAvailableExchanges'
      });
      
      // Set up event listener
      const messageListener = (event: MessageEvent) => {
        const message = event.data;
        if (message.type === 'availableExchanges') {
          const exchanges: string[] = message.data;
          setAvailableExchanges(exchanges || []);
          
          // Select the first exchange
          if (exchanges && exchanges.length > 0) {
            setExchange(exchanges.find(ex => ex === defaultExchange) || exchanges[0]);
          }
          
          setIsLoadingExchanges(false);
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Set 5-second timeout
      setTimeout(() => {
        setIsLoadingExchanges(false);
        window.removeEventListener('message', messageListener);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to fetch exchange list:', error);
      setIsLoadingExchanges(false);
    }
  };

  // Fetch symbol and timeframe info for the selected exchange when the exchange changes
  useEffect(() => {
    if (exchange) {
      fetchExchangeInfo(exchange);
    }
  }, [exchange]);

  // Fetch exchange info
  const fetchExchangeInfo = async (exchangeId: string) => {
    try {
      setIsLoading(true);
      
      // Request exchange info from backend
      VSCodeAPI.postMessage({
        type: 'getExchangeInfo',
        exchange: exchangeId
      });
      
      // Set up event listener
      const messageListener = (event: MessageEvent) => {
        const message = event.data;
        if (message.type === 'exchangeInfo') {
          const { symbols, timeframes } = message.data;
          setAvailableSymbols(symbols || []);
          setAvailableTimeframes(timeframes || []);
          
          // Select first symbol and timeframe
          if (symbols && symbols.length > 0) {
            setSymbol(symbols[0]);
          }
          
          if (timeframes && timeframes.length > 0) {
            setTimeframe(timeframes[Math.floor(timeframes.length / 2)] || timeframes[0]); // Select a middle timeframe
          }
          
          setIsLoading(false);
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Set 5-second timeout
      setTimeout(() => {
        setIsLoading(false);
        window.removeEventListener('message', messageListener);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to fetch exchange info:', error);
      setIsLoading(false);
    }
  };

  // Form submit handler
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Send data download request
    VSCodeAPI.postMessage({
      type: 'downloadDataset',
      config: {
        symbol,
        exchange,
        timeframe,
        startDate,
        endDate
      },
    });
    
    // Release submitting state after 5 seconds (should ideally receive completion message from backend)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 5000);
  };

  // Symbol search input change handler
  const handleSymbolSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase();
    setSymbolSearch(inputValue);
    // Show symbol list when search starts
    setShowSymbolList(true);
  };

  // Symbol selection handler
  const handleSelectSymbol = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setSymbolSearch('');
    setShowSymbolList(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Symbol list toggle handler
  const toggleSymbolList = () => {
    setShowSymbolList(!showSymbolList);
    if (!showSymbolList && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col space-y-4 mt-2 mb-6 p-2">
      <div className="text-lg font-bold text-[var(--vscode-editor-foreground)]">
        {assetType?.charAt(0).toUpperCase() + assetType?.slice(1)} Market Data Download
      </div>
      
      <div className="text-sm text-[var(--vscode-descriptionForeground)] mb-4">
        {assetType === 'crypto' && 'Download cryptocurrency market data to use for backtesting.'}
        {assetType === 'stock' && 'Download stock market data to use for backtesting.'}
        {assetType === 'forex' && 'Download forex market data to use for backtesting.'}
      </div>
      
      <div className="flex flex-col space-y-4">
        {/* Exchange selection */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-[var(--vscode-editor-foreground)]">Exchange</label>
          {isLoadingExchanges ? (
            <div className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm">
              Loading exchange list...
            </div>
          ) : (
            <select 
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              disabled={isLoading || availableExchanges.length === 0}
            >
              {availableExchanges.length === 0 ? (
                <option value="">No available exchanges</option>
              ) : (
                availableExchanges.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))
              )}
            </select>
          )}
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
            Selecting an exchange will display available symbols and timeframes for that exchange.
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-sm text-[var(--vscode-editor-foreground)]">
            Loading exchange info...
          </div>
        ) : !exchange ? (
          <div className="text-sm text-[var(--vscode-descriptionForeground)]">
            Select an exchange.
          </div>
        ) : (
          <>
            {/* Symbol selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--vscode-editor-foreground)]">Symbol</label>
                <button 
                  className="text-xs text-[var(--vscode-textLink-foreground)] hover:text-[var(--vscode-textLink-activeForeground)]"
                  onClick={toggleSymbolList}
                >
                  {showSymbolList ? 'Collapse Symbol List' : 'View Symbol List'}
                </button>
              </div>
              <div className="flex flex-col">
                <div className="relative">
                  <div className="flex items-center relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm"
                      placeholder={inputFocused || !symbol ? "Search Symbol (e.g., BTC/USDT)" : ""}
                      value={symbolSearch}
                      onChange={handleSymbolSearch}
                      onFocus={() => {
                        setInputFocused(true);
                        setShowSymbolList(true);
                      }}
                      onBlur={() => {
                        setInputFocused(false);
                        // Add a slight delay to allow clicking list items
                        setTimeout(() => {
                          if (!document.activeElement?.closest('.symbol-list-container')) {
                            setShowSymbolList(false);
                          }
                        }, 200);
                      }}
                    />
                    {symbol && !symbolSearch && !inputFocused && (
                      <div className="absolute left-0 right-0 p-1 pl-2 flex items-center pointer-events-none">
                        <span className="font-bold text-[var(--vscode-editor-foreground)]">{symbol}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-sm flex justify-end items-center">
                    <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                      Total {availableSymbols.length} symbols
                    </span>
                  </div>
                  
                  {showSymbolList && (
                    <div className="symbol-list-container mt-2 mb-4 max-h-50 overflow-y-auto bg-[var(--vscode-dropdown-background)] border border-[var(--vscode-dropdown-border)] rounded shadow-lg">
                      {filteredSymbols.length > 0 ? (
                        filteredSymbols.map((s) => (
                          <div 
                            key={s} 
                            className={`p-1 hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer text-[var(--vscode-dropdown-foreground)] ${symbol === s ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]' : ''}`}
                            onClick={() => handleSelectSymbol(s)}
                          >
                            {s}
                          </div>
                        ))
                      ) : (
                        <div className="p-1 text-[var(--vscode-descriptionForeground)]">
                          No matching symbols found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Timeframe selection */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--vscode-editor-foreground)]">Timeframe</label>
              <select 
                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                {availableTimeframes.length === 0 ? (
                  <option value="">No available timeframes</option>
                ) : (
                  availableTimeframes.map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))
                )}
              </select>
            </div>
          </>
        )}
        
        {/* Period selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--vscode-editor-foreground)]">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--vscode-editor-foreground)]">End Date</label>
            <input 
              type="date" 
              className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Download button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || isLoadingExchanges || !exchange || !symbol || !timeframe || !startDate || !endDate}
          className="mt-4 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-2 px-4 rounded hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? 'Downloading...' : 'Download Data'}
        </button>
        
        <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-2">
          Downloaded data will be saved in the dataset/{assetType} folder.<br />
          Filename format: {symbol ? symbol.replace('/', '_') : 'symbol'}_{timeframe}.csv
        </p>
      </div>
    </div>
  );
};

export default DatasetDownloaderView; 