import * as vscode from 'vscode';
import * as path from 'path';
import * as ccxt from 'ccxt';

// DatasetDownloader: Handles dataset download logic for crypto, stock, forex
export class DatasetDownloader {
  private workspacePath: string;
  private assetType: 'crypto' | 'stock' | 'forex';
  private ccxtExchanges: ccxt.Exchange[] = [];

  constructor(workspacePath: string, assetType: 'crypto' | 'stock' | 'forex') {
    this.workspacePath = workspacePath;
    this.assetType = assetType;
  }

  // Get available exchanges from CCXT
  public getAvailableExchanges(): string[] {
    try {
      if (this.assetType === 'crypto') {
        if (this.ccxtExchanges.length === 0) {
          this.ccxtExchanges = Object.values(ccxt.exchanges)  // @ts-ignore
            .map(exchange => new ccxt[exchange.toString()]())
            .filter(exchange => exchange.has.fetchOHLCV);
        }

        return this.ccxtExchanges.map(exchange => exchange.id);
      }
    } catch (error) {
      console.error('Failed to fetch exchange list:', error);
    }

    return [];
  }

  // Get exchange info (symbol list, timeframes, etc.)
  public async getExchangeInfo(exchangeId: string): Promise<any> {
    try {
      // Get info from exchange using CCXT library
      // @ts-ignore
      const exchange = new ccxt[exchangeId]({
        enableRateLimit: true,
      });
      
      // Get timeframes
      let timeframes: string[] = [];
      if (exchange.timeframes) {
        timeframes = Object.keys(exchange.timeframes);
      }
      
      try {
        // Load market data
        await exchange.loadMarkets();
        
        // Extract symbol list
        const symbols = Object.keys(exchange.markets).filter(symbol => {
          // Filter only active symbols
          const market = exchange.markets[symbol];
          return market.active !== false;
        });
        
        return {
          symbols,
          timeframes
        };
      } catch (error) {
        console.error('Failed to load exchange market data:', error);
      }
    } catch (error) {
      console.error('Failed to fetch exchange info:', error);
    }
  }

  // Download dataset (crypto only for now)
  public async download(config: any, progress: vscode.Progress<{ increment: number }>): Promise<string> {
    const { symbol, exchange, timeframe, startDate, endDate } = config;
    const datasetDir = path.join(this.workspacePath, 'dataset', this.assetType);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(datasetDir));
    const cleanSymbol = symbol.replace('/', '-');
    const formattedStartDate = startDate.replace(/-/g, '').substring(0, 8);
    const formattedEndDate = endDate.replace(/-/g, '').substring(0, 8);
    const fileName = `${exchange}_${cleanSymbol}_${timeframe}_${formattedStartDate}_${formattedEndDate}.csv`;
    const filePath = path.join(datasetDir, fileName);
    let currentProgress = 0;
    let data: string = '';

    if (this.assetType === 'crypto') {
      try {
        // @ts-ignore: Ignore ccxt type error
        const exchangeInstance = new ccxt[exchange]({ enableRateLimit: true });
        const since = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        let allCandles: any[] = [];
        let currentSince = since;
        let progressCount = 0;
        const timeframeMsMap: {[key: string]: number} = {
          '1s': 1000,
          '1m': 60 * 1000,
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '30m': 30 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '1d': 24 * 60 * 60 * 1000,
          '1w': 7 * 24 * 60 * 60 * 1000,
        };
        const timeframeMs = timeframeMsMap[timeframe] || (24 * 60 * 60 * 1000);
        const limit = 1000;
        const totalExpectedCandles = Math.ceil((end - since) / timeframeMs);
        const expectedBatches = Math.ceil(totalExpectedCandles / limit);
        while (currentSince < end) {
          try {
            const candles = await exchangeInstance.fetchOHLCV(symbol, timeframe, currentSince, limit);
            if (candles.length === 0) break;
            allCandles = [...allCandles, ...candles];
            const lastCandleTime = candles[candles.length - 1][0];
            currentSince = lastCandleTime + 1;
            progressCount++;
            const newProgress = Math.min(90, Math.floor((progressCount / expectedBatches) * 100));
            if (newProgress > currentProgress) {
              const increment = newProgress - currentProgress;
              progress.report({ increment });
              currentProgress = newProgress;
            }
          } catch (error) {
            console.error('Failed to fetch OHLCV data:', error);
            break;
          }
        }
        if (allCandles.length > 0) {
          data = this.convertCandlesToCSV(allCandles);
          await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(data));
        } else {
          throw new Error('No data downloaded.');
        }
      } catch (error: any) {
        console.error('CCXT data download failed:', error);
        throw error;
      }
    }
    if (currentProgress < 100) {
      progress.report({ increment: 100 - currentProgress });
    }
    return filePath;
  }

  // Convert CCXT OHLCV data to CSV
  private convertCandlesToCSV(candles: any[]): string {
    if (!candles || candles.length === 0) {
      return 'datetime,open,high,low,close,volume\n';
    }
    const headers = 'datetime,open,high,low,close,volume';
    const rows = candles.map(candle => {
      const [timestamp, open, high, low, close, volume] = candle;
      const datetime = new Date(timestamp).toISOString();
      return `${datetime},${open},${high},${low},${close},${volume}`;
    });
    return `${headers}\n${rows.join('\n')}`;
  }
} 