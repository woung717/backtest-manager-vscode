/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/services/datasetService.ts
import * as path from 'path';
import * as ccxt from 'ccxt';
import * as vscode from 'vscode';
import { DatasetInfo, ExchangeInfo } from '../types'; 

export interface IDatasetService {
  loadDatasetsInWorkspace(datasetRootPath: string): Promise<DatasetInfo[]>; 
  deleteDataset(datasetPath: string): Promise<boolean>; 
  getDatasetContent(datasetPath: string): Promise<OHLCV[]>; 
  downloadDataset(
    assetType: 'crypto' | 'stock' | 'forex',
    config: any,
    progressCallback?: (event: { message: string, increment?: number, overallProgress?: number }) => void
  ): Promise<string>;
  getExchangeInfo(exchangeId: string, assetType?: 'crypto' | 'stock' | 'forex'): Promise<ExchangeInfo | null>;
  getAvailableExchanges(assetType: 'crypto' | 'stock' | 'forex'): Promise<string[]>;
}

// Ensure OHLCV is imported if not already
import { OHLCV } from '../types';

export class DatasetService implements IDatasetService {
  private ccxtExchanges: ccxt.Exchange[] = [];
  private readonly ASSET_TYPES: ('crypto' | 'stock' | 'forex')[] = ['crypto', 'stock', 'forex'];
  private readonly timeframeMsMap: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  };

  constructor(private workspacePath: string) { 
    if (!workspacePath) {
      throw new Error("Workspace path cannot be empty for DatasetService.");
    }
  }

  // Convert CCXT OHLCV data to CSV with error handling
  private convertCandlesToCSV(candles: any[]): string {
    if (!candles || candles.length === 0) {
      return 'datetime,open,high,low,close,volume\n';
    }
    const headers = 'datetime,open,high,low,close,volume';
    const rows = candles.map(candle => {
      try {
        const [timestamp, open, high, low, close, volume] = candle;
        if (!timestamp || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
          console.warn('Invalid candle data:', candle);
          return null;
        }
        const datetime = new Date(timestamp).toISOString();
        return `${datetime},${open},${high},${low},${close},${volume}`;
      } catch (error) {
        console.warn('Error processing candle:', error, candle);
        return null;
      }
    }).filter(row => row !== null);
    return `${headers}\n${rows.join('\n')}`;
  }

  async getAvailableExchanges(assetType: 'crypto' | 'stock' | 'forex'): Promise<string[]> {
    console.log(`DatasetService.getAvailableExchanges called for assetType: ${assetType}`);
    if (assetType === 'crypto') {
      try {
        if (this.ccxtExchanges.length === 0) {
          this.ccxtExchanges = Object.values(ccxt.exchanges)  // @ts-ignore
            .map(exchangeId => new ccxt[exchangeId]())
            .filter(exchange => exchange.has.fetchOHLCV);
        }
        return this.ccxtExchanges.map(exchange => exchange.id);
      } catch (error) {
        console.error('Failed to fetch CCXT exchange list:', error);
        return []; 
      }
    }
    console.warn(`Asset type ${assetType} not yet supported for fetching exchanges.`);
    return [];
  }

  async getExchangeInfo(exchangeId: string, assetType: 'crypto' | 'stock' | 'forex' = 'crypto'): Promise<ExchangeInfo | null> {
    console.log(`DatasetService.getExchangeInfo called for exchange: ${exchangeId}, assetType: ${assetType}`);
    if (assetType === 'crypto') {
      try {
        // @ts-ignore
        const exchange = new ccxt[exchangeId]({ enableRateLimit: true });
        let timeframes: string[] = [];
        if (exchange.timeframes) {
          timeframes = Object.keys(exchange.timeframes);
        }
        await exchange.loadMarkets();
        const symbols = Object.keys(exchange.markets).filter(symbol => {
          const market = exchange.markets[symbol];
          return market.active !== false;
        });
        return {
          id: exchangeId, name: exchange.name, symbols, timeframes, has: exchange.has
        } as ExchangeInfo;
      } catch (error) {
        console.error(`Failed to load exchange market data for ${exchangeId}:`, error);
        return null;
      }
    }
    console.warn(`Asset type ${assetType} not yet supported for getExchangeInfo.`);
    return null;
  }

  private async downloadCryptoData(
    exchangeId: string,
    symbol: string,
    timeframe: string,
    startDate: string,
    endDate: string,
    progressCallback?: (event: { message: string, increment?: number, overallProgress?: number }) => void
  ): Promise<any[]> {
    // @ts-ignore
    const exchange = new ccxt[exchangeId]({
      enableRateLimit: true,
      timeout: 30000
    });

    const since = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const timeframeMs = this.timeframeMsMap[timeframe];
    const limit = exchange.has['fetchOHLCV'] === 'emulated' ? 100 : 1000;
    const totalExpectedCandles = Math.ceil((end - since) / timeframeMs);
    const batchSize = Math.min(limit, totalExpectedCandles);
    const expectedBatches = Math.ceil(totalExpectedCandles / batchSize);
    
    if (progressCallback) {
      progressCallback({
        message: '',
        increment: 5
      });
    }

    let allCandles: any[] = [];
    let currentTime = since;
    let batchCount = 0;

    while (currentTime < end) {
      try {
        const candles = await exchange.fetchOHLCV(symbol, timeframe, currentTime, limit);
        if (!candles || candles.length === 0) { 
          break;
        }

        allCandles = [...allCandles, ...candles];
        const lastCandleTime = candles[candles.length - 1][0];
        currentTime = lastCandleTime + timeframeMs;
        batchCount++;

        if (progressCallback) {
          const progress = Math.min(90, Math.floor((batchCount / expectedBatches) * 90));
          progressCallback({
            message: '',
            increment: progress / expectedBatches
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, exchange.rateLimit));
      } catch (error: any) {
        console.error(`Error downloading batch: ${error.message}`);
        if (error.message.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        throw error;
      }
    }

    // Filter candles to exact date range and remove duplicates
    return allCandles
      .filter(candle => candle[0] >= since && candle[0] <= end)
      .sort((a, b) => a[0] - b[0])
      .filter((candle, index, self) => 
        index === 0 || candle[0] !== self[index - 1][0]
      );
  }

  async downloadDataset(
    assetType: 'crypto' | 'stock' | 'forex',
    config: any,
    progressCallback?: (event: { message: string, increment?: number, overallProgress?: number }) => void
  ): Promise<string> {
    console.log('DatasetService.downloadDataset called with config:', config, 'assetType:', assetType);
    const { symbol, exchange, timeframe, startDate, endDate } = config;
    
    if (!this.workspacePath) {
        const errorMessage = "Workspace path is not set. Cannot download dataset.";
        console.error(errorMessage);
        if (progressCallback) {
          progressCallback({ message: errorMessage });
        }
        throw new Error(errorMessage);
    }

    if (!symbol || !exchange || !timeframe || !startDate || !endDate) {
        const errorMessage = "Missing required parameters for dataset download";
        console.error(errorMessage);
        if (progressCallback) {
          progressCallback({ message: errorMessage });
        }
        throw new Error(errorMessage);
    }

    if (!this.timeframeMsMap[timeframe]) {
        const errorMessage = `Unsupported timeframe: ${timeframe}`;
        console.error(errorMessage);
        if (progressCallback) {
          progressCallback({ message: errorMessage });
        }
        throw new Error(errorMessage);
    }

    const datasetDir = path.join(this.workspacePath, 'dataset', assetType);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(datasetDir));
    
    const cleanSymbol = symbol.replace(/\//g, '-'); // Ensure all slashes are replaced
    const formattedStartDate = startDate.replace(/-/g, '').substring(0, 8);
    const formattedEndDate = endDate.replace(/-/g, '').substring(0, 8);
    const fileName = `${exchange}_${cleanSymbol}_${timeframe}_${formattedStartDate}_${formattedEndDate}.csv`; // Standardized filename
    const filePath = path.join(datasetDir, fileName);
    
    const currentProgress = 0;

    if (progressCallback) {
      progressCallback({ message: `Starting download for ${symbol}...`, overallProgress: 0 });
    }

    if (assetType === 'crypto') {
      try {
        const candles = await this.downloadCryptoData(
          exchange,
          symbol,
          timeframe,
          startDate,
          endDate,
          progressCallback
        );

        if (candles && candles.length > 0) {
          const data = this.convertCandlesToCSV(candles);
          vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(data, 'utf-8'));
          if (progressCallback) {
            progressCallback({
              message: `Successfully saved ${candles.length} candles to ${fileName}`,
              overallProgress: 100
            });
          }
          return filePath;
        }
      } catch (error: any) {
        if (progressCallback) {
          progressCallback({ message: `Download failed for ${symbol}: ${error.message}`, overallProgress: currentProgress });
        }
        throw error;
      }
    } else {
        const message = `Asset type '${assetType}' is not supported for download.`;
        console.warn(message);
        if (progressCallback) {
          progressCallback({ message, overallProgress: 100 });
        }
        return ""; 
    }
    return filePath;
  }

  // Removed getDatasets() method implementation
  // async getDatasets(): Promise<DatasetInfo[]> {
  //   console.log('DatasetService.getDatasets called - this is a general fetch, not workspace specific for tree');
  //   return Promise.resolve([]);
  // }

  async loadDatasetsInWorkspace(datasetRootPath: string): Promise<DatasetInfo[]> {
    console.log(`DatasetService.loadDatasetsInWorkspace called for datasetRootPath: ${datasetRootPath}`);
    const allDatasets: DatasetInfo[] = [];

    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(datasetRootPath));
      console.log(`Ensured root dataset folder exists: ${datasetRootPath}`);

      // 2. Iterate over defined asset types and ensure their subfolders exist
      for (const assetType of this.ASSET_TYPES) {
        const assetTypePath = path.join(datasetRootPath, assetType);

        await vscode.workspace.fs.createDirectory(vscode.Uri.file(assetTypePath));
        console.log(`Ensured asset type folder exists: ${assetTypePath}`);

        try {
          (await vscode.workspace.fs.readDirectory(vscode.Uri.file(assetTypePath))).map(([name, _]) => name)
            .filter(fileName => fileName.endsWith('.csv') || fileName.endsWith('.json')) // Assuming JSON is also a valid dataset format
            .forEach(fileName => {
              const filePath = path.join(assetTypePath, fileName);
              // Basic parsing from filename, can be made more robust
              const nameParts = path.basename(fileName, path.extname(fileName)).split('_');
              const dataset: DatasetInfo = {
                name: fileName,
                path: filePath,
                assetType: assetType,
                exchange: nameParts[0] || 'Unknown',
                symbol: nameParts[1] || 'Unknown',
                timeframe: nameParts[2] || 'Unknown',
                // startDate, endDate, totalBars would require reading the file content
              };
              allDatasets.push(dataset);
            });
        } catch (readDirError) {
          console.error(`Error reading directory ${assetTypePath}:`, readDirError);
          // Continue to next asset type
        }
      }
    } catch (error) {
      console.error(`Error loading datasets from workspace ${datasetRootPath}:`, error);
      throw error; // Re-throw to be caught by the caller (DatasetTreeProvider)
    }
    console.log(`Loaded ${allDatasets.length} datasets from ${datasetRootPath}`);
    return allDatasets;
  }

  async deleteDataset(datasetPath: string): Promise<boolean> {
    console.log(`DatasetService.deleteDataset called for path: ${datasetPath}`);
    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(datasetPath), { recursive: true });
      console.log(`Successfully deleted dataset: ${datasetPath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting dataset ${datasetPath}:`, error);
      return false;
    }
  }

  public async getDatasetContent(datasetPath: string): Promise<OHLCV[]> {
    try {
        console.log(`DatasetService.getDatasetContent called for path: ${datasetPath}`);
        const fileContentBuffer = await vscode.workspace.fs.readFile(vscode.Uri.file(datasetPath));
        const fileContent = fileContentBuffer.toString(); // Convert buffer to string
        const lines = fileContent.split(/\r?\n/); // Handles both CRLF and LF
        
        if (lines.length < 2) { // Needs at least header and one data line
            throw new Error('Dataset is empty or has no data lines.');
        }

        const headerLine = lines[0].trim();
        if (!headerLine) {
            throw new Error('Dataset header is missing.');
        }
        const header = headerLine.split(',');
        
        // Determine indices of required columns
        const requiredColumns = ['datetime', 'open', 'high', 'low', 'close', 'volume'];
        const colIndices: Record<string, number> = {};
        for (const col of requiredColumns) {
            const index = header.indexOf(col);
            if (index === -1) {
                throw new Error(`Required column "${col}" not found in dataset header: ${headerLine}`);
            }
            colIndices[col] = index;
        }

        const data = lines.slice(1)
            .map((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                  return null;
                }
                
                const values = trimmedLine.split(',');
                if (values.length !== header.length) {
                  console.warn(`Skipping line ${index + 2}: expected ${header.length} columns, found ${values.length}. Line: "${trimmedLine}"`);
                  return null;
                }

                try {
                    return {
                      datetime: values[colIndices['datetime']],
                      open: parseFloat(values[colIndices['open']]),
                      high: parseFloat(values[colIndices['high']]),
                      low: parseFloat(values[colIndices['low']]),
                      close: parseFloat(values[colIndices['close']]),
                      volume: parseFloat(values[colIndices['volume']])
                    } as OHLCV;
                } catch (parseError) {
                    console.warn(`Skipping line ${index + 2} due to parsing error: ${parseError}. Line: "${trimmedLine}"`);
                    return null;
                }
            })
            .filter(item => item !== null && 
                             !isNaN(item.open) && 
                             !isNaN(item.high) && 
                             !isNaN(item.low) && 
                             !isNaN(item.close) && 
                             !isNaN(item.volume) &&
                             item.datetime // ensure datetime is not empty
            ) as OHLCV[];
        
        if (!data || data.length === 0) {
             throw new Error('No valid data found in dataset or dataset is empty after parsing.');
        }
        console.log(`Successfully parsed ${data.length} OHLCV records from ${datasetPath}`);
        return data;
    } catch (error: any) {
        console.error(`Error reading or parsing dataset file ${datasetPath}:`, error);
        // Re-throw with a more user-friendly message, but keep original error context if possible
        throw new Error(`Failed to load dataset content from ${datasetPath}: ${error.message}`);
    }
  }
}
