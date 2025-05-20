import * as vscode from 'vscode';
import { BacktestResultView } from './backtestResultView';
import { ProjectInfo, DatasetInfo } from './types';
import { Database } from './database';
import { ProjectTreeProvider } from './projectTreeProvider';
import { Backtester as BacktestRunner } from './backtester';
import * as path from 'path';

export class BacktestSettingView {
    private _extensionUri: vscode.Uri;
    private _currentProject?: ProjectInfo;
    private _resultProvider: BacktestResultView;
    private _panel?: vscode.WebviewPanel;
    private _database: Database;
    private _treeProvider: ProjectTreeProvider;
    private _datasets: DatasetInfo[] = [];

    private readonly backtraderStrategyClassPattern = /class\s+(\w+)\s*\([^.]+\.Strategy\):/;

    constructor(extensionUri: vscode.Uri, treeProvider: ProjectTreeProvider) {
        this._extensionUri = extensionUri;
        this._resultProvider = new BacktestResultView(extensionUri);
        this._database = Database.getInstance();
        this._treeProvider = treeProvider;
    }

    public async openBacktestSetting(projectName: string) {
        const project = await this._database.getProjectByName(projectName);

        if (project) {
            const entryFilePath = vscode.Uri.joinPath(vscode.Uri.file(project.path), project.entryFile);

            try {
                vscode.workspace.fs.stat(entryFilePath);
            } catch (error) {
                vscode.window.showErrorMessage('Project file does not exist.');
                return;
            }

            const buffer = await vscode.workspace.fs.readFile(entryFilePath);
            const strategyCode = Buffer.from(buffer).toString('utf8');
            const strategyClassMatch = strategyCode.match(this.backtraderStrategyClassPattern);

            project.strategy = strategyClassMatch?.[1] || undefined;
            
            this._currentProject = project;
            
            const [_, lastConfig] = await Promise.all([
                this._loadDatasets(),
                this._getLastBacktestConfig()
            ]);
            
            this.show();
            this._updateWebview(lastConfig);
        }
    }

    private async _loadDatasets(): Promise<void> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return;
        }
        
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const datasetRootPath = path.join(workspacePath, 'dataset');
        
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(datasetRootPath));
        } catch (error) {
            this._datasets = [];
            return;
        }
        
        const datasets: DatasetInfo[] = [];
        const assetTypes = ['crypto']; //'stock', 'forex'
        
        for (const assetType of assetTypes) {
            const assetFolderPath = path.join(datasetRootPath, assetType);

            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(assetFolderPath));
            } catch (error) {
                continue;
            }
            
            const files = (await vscode.workspace.fs.readDirectory(vscode.Uri.file(assetFolderPath)))
                .map(([name, _]) => (name));
            
            for (const file of files) {
                if (file.endsWith('.csv') || file.endsWith('.json')) {
                    const filePath = path.join(assetFolderPath, file);
                    const nameParts = path.basename(file, path.extname(file)).split('_');
                    const exchange = nameParts[0] || 'Unknown';
                    const symbol = nameParts[1] || 'Unknown';
                    const timeframe = nameParts[2] || 'Unknown';
                    
                    datasets.push({
                        name: file,
                        path: filePath,
                        assetType: assetType as 'crypto' | 'stock' | 'forex',
                        exchange,
                        symbol,
                        timeframe,
                    });
                }
            }
        }
        
        this._datasets = datasets;
    }

    private async _getLastBacktestConfig(): Promise<any | undefined> {
        if (!this._currentProject || !this._currentProject._id) {
            return undefined;
        }

        try {
            const project = await this._database.getProject(this._currentProject._id);
            return project?.lastConfig;
        } catch (error) {
            console.error('Failed to get last backtest config:', error);
            return undefined;
        }
    }

    public show() {
        if (!this._panel) {
            this._panel = vscode.window.createWebviewPanel(
                'backtestSettings',
                'Backtest Settings',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [this._extensionUri]
                }
            );

            this._panel.webview.onDidReceiveMessage(async data => {
                try {
                    switch (data.type) {
                        case 'runBacktest':
                            if (!this._currentProject || !this._currentProject._id) {
                                vscode.window.showErrorMessage('Please select a project.');
                                return;
                            }
                            
                            try {
                                const backtest = new BacktestRunner(data.config, this._currentProject);
                                const result = await backtest.run();
                                
                                result.config = data.config;
                                
                                await this._database.addBacktestResult(this._currentProject._id, result);
                                await this._database.updateLastConfig(this._currentProject._id, data.config);
                                
                                this._resultProvider.showResult(result);
                                this._treeProvider.updateData();
                            } catch (error) {
                                vscode.window.showErrorMessage(`Error occurred during backtest execution: ${error}`);
                            }
                            break;
                        case 'refresh':
                            await this._loadDatasets();
                            this._updateWebview();
                            break;
                        default:
                            console.warn(`Unknown message type: ${data.type}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Error processing message: ${error}`);
                }
            });

            this._panel.onDidDispose(() => {
                this._panel = undefined;
            });
        }

        this._panel.webview.html = this.getHtmlContent(this._panel.webview);
        
        Promise.all([this._loadDatasets(), this._getLastBacktestConfig()])
            .then(([_, lastConfig]) => {
                this._updateWebview(lastConfig);
            });
            
        this._panel.reveal(vscode.ViewColumn.Two);
    }

    private _updateWebview(lastConfig?: any) {
        if (this._panel) {
            this._panel.webview.postMessage({ 
                type: 'update', 
                data: {
                    currentProject: this._currentProject ? {
                        name: this._currentProject.name,
                        path: this._currentProject.path,
                        engine: this._currentProject.engine
                    } : undefined,
                    datasets: this._datasets,
                    lastConfig: lastConfig
                }
            });
        }
    }

    private getHtmlContent(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'backtestSetting.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'vscode.css')
        );

        const nonce = this._getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} 'self' data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <title>Backtest Settings</title>
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

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
