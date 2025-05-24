import * as vscode from 'vscode';
// import { DatasetDownloader } from './datasetDownloader'; // Removed
import { IDatasetService } from '../services/datasetService'; // Added

export class DatasetDownloaderView {
  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private assetType: 'crypto' | 'stock' | 'forex';
  // private downloader: DatasetDownloader; // Removed
  private datasetService: IDatasetService; // Added

  constructor(
    extensionUri: vscode.Uri, 
    assetType: 'crypto' | 'stock' | 'forex',
    // workspacePath: string, // Removed
    datasetService: IDatasetService // Injected
  ) {
    this.extensionUri = extensionUri;
    this.assetType = assetType;
    this.datasetService = datasetService; // Store injected service
    // this.downloader = new DatasetDownloader(workspacePath, assetType); // Removed
  }

  public show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      // Create webview panel
      this.panel = vscode.window.createWebviewPanel(
        'datasetDownloader',
        `${this.assetType.charAt(0).toUpperCase() + this.assetType.slice(1)} Data Download`,
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
              // await this.downloadDataset(data.config); // Old
              await this.downloadDatasetWithService(data.config); // New
              break;
            case 'refresh':
              vscode.commands.executeCommand('backtestManager.refreshDatasetView');
              break;
            case 'getExchangeInfo':
              // const exchangeInfo = await this.downloader.getExchangeInfo(data.exchange); // Old
              const exchangeInfo = await this.datasetService.getExchangeInfo(data.exchange, this.assetType); // New
              this.panel?.webview.postMessage({
                type: 'exchangeInfo',
                data: exchangeInfo
              });
              break;
            case 'getAvailableExchanges':
              // const exchanges = this.downloader.getAvailableExchanges(); // Old
              const exchanges = await this.datasetService.getAvailableExchanges(this.assetType); // New
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

  private handleProgress(vscodeProgress: vscode.Progress<{ message?: string; increment?: number }>) {
    return (serviceProgress: { message: string, increment?: number, overallProgress?: number }) => {
        if (serviceProgress.increment) {
            vscodeProgress.report({ message: serviceProgress.message, increment: serviceProgress.increment });
        } else if (serviceProgress.overallProgress !== undefined) {
            // This part needs care: vscode.Progress typically sums increments.
            // If overallProgress is provided, you might need to calculate the final increment
            // or just use it for a final message.
            // For simplicity, let's assume the service sends incremental updates and a final overallProgress=100 update.
            // A more robust way would be to track current progress and calculate increment if only overall is given.
            if (serviceProgress.overallProgress === 100 && serviceProgress.increment === undefined) {
                 // Assuming this is the final message, report without specific increment if not provided
                 vscodeProgress.report({ message: serviceProgress.message });
            } else {
                 vscodeProgress.report({ message: serviceProgress.message }); // Fallback if only message or overallProgress without increment
            }
        } else {
            vscodeProgress.report({ message: serviceProgress.message });
        }
    };
  }

  private async downloadDatasetWithService(config: any): Promise<void> { // Renamed from downloadDataset
    try {
        const { symbol, exchange, timeframe } = config;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading ${exchange} ${symbol} ${timeframe} data...`,
            cancellable: false // Assuming non-cancellable for now based on original
        }, async (progress) => {
            try {
                // Create the progress callback function that maps service progress to vscode.Progress
                const progressCallback = this.handleProgress(progress);
                await this.datasetService.downloadDataset(this.assetType, config, progressCallback);
                vscode.window.showInformationMessage(`${exchange} ${symbol} ${timeframe} data downloaded successfully.`);
            } catch (error: any) {
                vscode.window.showWarningMessage(`Data download failed: ${error.message}.`);
            }
            // Ensure this command is correctly handled elsewhere or by the user's setup
            vscode.commands.executeCommand('backtestManager.refreshDatasetView');
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error downloading data: ${error.message}`);
    }
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