import * as vscode from 'vscode';
import * as path from 'path';
import * as ccxt from 'ccxt';

export class DatasetDownloaderView {
  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private assetType: 'crypto' | 'stock' | 'forex';
  private workspacePath: string;
  private ccxtExchanges: ccxt.Exchange[] = [];

  constructor(
    extensionUri: vscode.Uri, 
    assetType: 'crypto' | 'stock' | 'forex',
    workspacePath: string
  ) {
    this.extensionUri = extensionUri;
    this.assetType = assetType;
    this.workspacePath = workspacePath;
  }

  public show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      // Create webview panel
      this.panel = vscode.window.createWebviewPanel(
        'datasetDownloader',
        `${this.assetType.charAt(0).toUpperCase() + this.assetType.slice(1)} Data Download`, // Title based on asset type
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [this.extensionUri]
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      // Register message handling event
      this.panel.webview.onDidReceiveMessage(async data => {
        try {
          switch (data.type) {
            case 'downloadDataset':
              await this.downloadDataset(data.config);
              break;
            case 'refresh':
              vscode.commands.executeCommand('myExtension.refreshDatasetView');
              break;
            case 'getExchangeInfo':
              const exchangeInfo = await this.getExchangeInfo(data.exchange);
              this.panel?.webview.postMessage({
                type: 'exchangeInfo',
                data: exchangeInfo
              });
              break;
            case 'getAvailableExchanges':
              const exchanges = this.getAvailableExchanges(this.assetType);
              this.panel?.webview.postMessage({
                type: 'availableExchanges',
                data: exchanges
              });
              break;
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error processing message: ${error.message}`);
        }
      });
    }

    // Set webview HTML
    this.panel.webview.html = this.getHtmlContent();
    this.updateWebview();
    this.panel.reveal(vscode.ViewColumn.Two);
  }

  private updateWebview() {
    if (this.panel) {
      this.panel.webview.postMessage({ 
        type: 'update', 
        data: {
          assetType: this.assetType
        }
      });
    }
  }

  // Get available exchanges from CCXT
  private getAvailableExchanges(assetType: 'crypto' | 'stock' | 'forex'): string[] {
    try {
      if (assetType === 'crypto') {
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
  private async getExchangeInfo(exchangeId: string): Promise<any> {
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
  
  private async downloadDataset(config: any): Promise<void> {
    try {
      const { symbol, exchange, timeframe, startDate, endDate } = config;
      
      const datasetDir = path.join(this.workspacePath, 'dataset', this.assetType);
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(datasetDir));
      
      const cleanSymbol = symbol.replace('/', '-');
      
      const formattedStartDate = startDate.replace(/-/g, '').substring(0, 8);
      const formattedEndDate = endDate.replace(/-/g, '').substring(0, 8);
      
      const fileName = `${exchange}_${cleanSymbol}_${timeframe}_${formattedStartDate}_${formattedEndDate}.csv`;
      const filePath = path.join(datasetDir, fileName);
      
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${exchange} ${symbol} ${timeframe} data...`,
        cancellable: false
      }, async (progress) => {
        // Set initial progress
        progress.report({ increment: 0 });
        let currentProgress = 0;
        
        // Data download logic - use CCXT in actual implementation
        let data: string;
        
        // Branch download logic based on asset type
        if (this.assetType === 'crypto') {
          // Crypto data download - use CCXT library
          try {
            // Create CCXT instance
            // @ts-ignore: Ignore ccxt type error
            const exchangeInstance = new ccxt[exchange]({
              enableRateLimit: true,
            });
            
            // Set start and end times
            const since = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            
            // Collect data
            let allCandles: any[] = [];
            let currentSince = since;
            let progressCount = 0;
            
            // Calculate estimated number of requests for progress indication
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
            
            const timeframeMs = timeframeMsMap[timeframe] || (24 * 60 * 60 * 1000); // Default to 1 day
            const limit = 1000; // Common CCXT API limit
            const totalExpectedCandles = Math.ceil((end - since) / timeframeMs);
            const expectedBatches = Math.ceil(totalExpectedCandles / limit);
            
            while (currentSince < end) {
              try {
                // Fetch candle data
                const candles = await exchangeInstance.fetchOHLCV(symbol, timeframe, currentSince, limit);
                
                if (candles.length === 0) {
                  break;
                }
                
                allCandles = [...allCandles, ...candles];
                
                // Set next start time
                const lastCandleTime = candles[candles.length - 1][0];
                currentSince = lastCandleTime + 1;
                
                // Update progress
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
              // Convert to CSV
              data = this.convertCandlesToCSV(allCandles);
              vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(data));
            } else {
              throw new Error('No data downloaded.');
            }
            
          } catch (error: any) {
            console.error('CCXT data download failed:', error);
            vscode.window.showWarningMessage(`Actual data download failed: ${error.message}.`);
          }
        }
        
        // Report remaining progress (up to 100%)
        if (currentProgress < 100) {
          progress.report({ increment: 100 - currentProgress });
        }
        
        // Success message
        vscode.window.showInformationMessage(`${exchange} ${symbol} ${timeframe} data downloaded successfully.`);
        
        // Refresh dataset view
        vscode.commands.executeCommand('myExtension.refreshDatasetView');
      });
      
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error downloading data: ${error.message}`);
    }
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

  private getHtmlContent(): string {
    const scriptUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webviews', 'datasetDownloader.js')
    );
    const styleUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webviews', 'vscode.css')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this.panel?.webview.cspSource} 'self' data:; style-src ${this.panel?.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <title>Dataset Download</title>
      <link href="${styleUri}" rel="stylesheet" />
      <script nonce="${nonce}">
        window.acquireVsCodeApi = acquireVsCodeApi;
      </script>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
} 