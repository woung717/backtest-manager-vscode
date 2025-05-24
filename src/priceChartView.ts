import * as vscode from 'vscode';
import { Backtest, ChartData, OHLCV } from './types';
import { IDatasetService } from '../services/datasetService'; // Added

export class PriceChartView {
  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private datasetService: IDatasetService; // Added

  constructor(extensionUri: vscode.Uri, datasetService: IDatasetService) { // Modified
    this.extensionUri = extensionUri;
    this.datasetService = datasetService; // Added
  }

  private async loadDataset(datasetPath: string): Promise<OHLCV[] | undefined> { // Modified
    try {
      return await this.datasetService.getDatasetContent(datasetPath);
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message || `Failed to load dataset: ${datasetPath}`);
      return undefined;
    }
  }

  public async showDatasetOnlyPriceChart(datasetPath: string) {
    const dataset = await this.loadDataset(datasetPath);
    if (!dataset) { // Check if dataset loading failed
        return; 
    }

    this.panel = vscode.window.createWebviewPanel(
      'priceChartView',
      'Price Chart',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.html = this.getHtmlContent();

    this.updateWebview(
      {
        backtestId: undefined,
        datasetPath: datasetPath,
        ohlcv: dataset, // dataset is already OHLCV[] | undefined, no need for '!'
        trades: []
      }
    );
  }

  public async showPriceChart(backtest: Backtest) {
    if (!backtest?.config?.datasetPaths || !backtest.trades) {
      vscode.window.showErrorMessage('No dataset or trades found.');
      return;
    }

    const datasetPath = backtest?.config?.datasetPaths[0];
    const dataset = await this.loadDataset(datasetPath);
    if (!dataset) { // Check if dataset loading failed
        return;
    }
    
    this.panel = vscode.window.createWebviewPanel(
      'priceChartView',
      'Price Chart',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.html = this.getHtmlContent();

    this.updateWebview(
      {
        backtestId: backtest.id,
        datasetPath: backtest?.config?.datasetPaths[0],
        ohlcv: dataset!, 
        trades: Object.values(backtest.trades)
      }
    );
  }

  private updateWebview(chartData: ChartData) {
    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'update',
        data: {
          chartData: chartData
        }
      });
    }
  }

  private getHtmlContent(): string {
    const scriptUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webviews', 'priceChart.js')
    );
    const styleUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webviews', 'vscode.css')
    );
    const chartScriptUri = this.panel?.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'node_modules', 'lightweight-charts', 'dist', 'lightweight-charts.standalone.production.js')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this.panel?.webview.cspSource} 'self' data:; style-src ${this.panel?.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <title>Dataset View</title>
      <link href="${styleUri}" rel="stylesheet" />
      <script nonce="${nonce}" src="${chartScriptUri}"></script>
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