import * as vscode from 'vscode';
import { BacktestResultView } from './backtestResultView';
import { ProjectInfo, DatasetInfo, Engine } from './types'; // Added Engine
// import { Database } from './database'; // Removed
import { ProjectTreeProvider } from './projectTreeProvider';
// import { Backtester as BacktestRunner } from './backtester'; // Removed
import * as path from 'path';
// import { execSync, spawnSync } from 'child_process'; // Removed

// Import service interfaces
import { IProjectService } from '../services/projectService';
import { IDatasetService } from '../services/datasetService';
import { IPythonEnvironmentService } from '../services/pythonEnvironmentService';
import { IBacktestService, BacktestRunConfig } from '../services/backtestService'; // Added BacktestRunConfig


export class BacktestSettingView {
    private _extensionUri: vscode.Uri;
    private _currentProject?: ProjectInfo;
    private _resultProvider: BacktestResultView; // Keeping this for now
    private _panel?: vscode.WebviewPanel;
    // private _database: Database; // Removed
    private _treeProvider: ProjectTreeProvider; // Keeping this for now
    private _datasets: DatasetInfo[] = [];
    private _workspacePath: string; // Added

    // private readonly backtraderStrategyClassPattern = /class\s+(\w+)\s*\([^.]+\.Strategy\):/; // Removed

    // Injected services
    private projectService: IProjectService;
    private datasetService: IDatasetService;
    private pythonEnvService: IPythonEnvironmentService;
    private backtestService: IBacktestService;

    constructor(
        extensionUri: vscode.Uri, 
        treeProvider: ProjectTreeProvider,
        projectService: IProjectService,
        datasetService: IDatasetService,
        pythonEnvService: IPythonEnvironmentService,
        backtestService: IBacktestService, // Added
        workspacePath: string // Added
    ) {
        this._extensionUri = extensionUri;
        this._resultProvider = new BacktestResultView(extensionUri); // Assuming this is still created here
        // this._database = Database.getInstance(); // Removed
        this._treeProvider = treeProvider;
        this.projectService = projectService;
        this.datasetService = datasetService;
        this.pythonEnvService = pythonEnvService;
        this.backtestService = backtestService;
        this._workspacePath = workspacePath;
    }

    public async openBacktestSetting(projectName: string) {
        const project = await this.projectService.getProjectByName(projectName);

        if (project && project._id) { // Ensure project and _id exist
            // Check if entry file exists (ProjectService could also offer a method for this)
            const entryFilePath = vscode.Uri.joinPath(vscode.Uri.file(project.path), project.entryFile);
            try {
                await vscode.workspace.fs.stat(entryFilePath); // Standard VS Code API for file check
            } catch (error) {
                vscode.window.showErrorMessage(`Project entry file "${project.entryFile}" not found at ${project.path}.`);
                return;
            }

            project.strategy = await this.projectService.getProjectStrategyClass(project);
            this._currentProject = project;
            
            const datasetRootPath = path.join(this._workspacePath, 'dataset');
            this._datasets = await this.datasetService.loadDatasetsInWorkspace(datasetRootPath);
            
            // Fetch the full project details again to get the most recent lastConfig
            // Or, if getProjectByName already returns it, use that. Assuming getProject returns full details.
            const fullProject = await this.projectService.getProject(project._id);
            const lastConfig = fullProject?.lastConfig;

            // Check engine library
            const pythonPath = await this.pythonEnvService.getPythonPath();
            if (pythonPath) {
                const engineLib = project.engine === 'backtrader' ? 'backtrader' : 
                                  project.engine === 'vectorbt' ? 'vectorbt' : undefined;
                if (engineLib) {
                    const isInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, engineLib);
                    if (!isInstalled) {
                        vscode.window.showErrorMessage(`${engineLib} library is not installed. Please install it (e.g., 'pip install ${engineLib}')`);
                    }
                }
            } else {
                 vscode.window.showWarningMessage('Python path not configured. Cannot check engine libraries.');
            }

            this.show(); // Creates and shows the panel
            this._updateWebview(lastConfig); // Update with fetched data
        } else {
            vscode.window.showErrorMessage(`Project "${projectName}" not found.`);
        }
    }

    // _loadDatasets and _getLastBacktestConfig methods are now fully removed.
    // _checkEngineLibrary was also effectively removed by not being called and its logic moved.

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
                            
                            if (!this._currentProject || !this._currentProject._id) {
                                vscode.window.showErrorMessage('Current project is not properly set. Cannot run backtest.');
                                return;
                            }
                            const currentProjectId = this._currentProject._id; // Capture for use in closures/promises
                            
                            try {
                                const result = await this.backtestService.runBacktest(currentProjectId, data.config as BacktestRunConfig);
                                
                                // Assuming 'result' from backtestService is compatible with 'BacktestResult' type for projectService
                                // and that 'result' might not have 'config' property, so add it if needed.
                                const resultToStore = { ...result, config: data.config };
                
                                await this.projectService.addBacktestResult(currentProjectId, resultToStore as Backtest);
                                await this.projectService.updateLastConfig(currentProjectId, data.config);
                                
                                this._resultProvider.showResult(resultToStore as Backtest); // Ensure resultProvider still works
                                this._treeProvider.refresh(); // NEW: Changed from updateData()
                            } catch (error: any) {
                                vscode.window.showErrorMessage(`Error occurred during backtest execution: ${error.message || error}`);
                            }
                            break;
                        case 'refresh':
                            const datasetRootPathRefresh = path.join(this._workspacePath, 'dataset');
                            this._datasets = await this.datasetService.loadDatasetsInWorkspace(datasetRootPathRefresh);
                            
                            let lastConfigRefresh = undefined;
                            if (this._currentProject && this._currentProject._id) {
                                const projectDetails = await this.projectService.getProject(this._currentProject._id);
                                lastConfigRefresh = projectDetails?.lastConfig;
                            }
                            this._updateWebview(lastConfigRefresh); // Call _updateWebview with the potentially updated lastConfig
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
        
        // Refactored data loading logic for show()
        // If _currentProject is set, fetch its details and datasets.
        // Otherwise, _updateWebview will be called with undefined/empty data initially.
        if (this._currentProject && this._currentProject._id) {
            this.projectService.getProject(this._currentProject._id).then(projectDetails => {
                const datasetRootPath = path.join(this._workspacePath, 'dataset');
                this.datasetService.loadDatasetsInWorkspace(datasetRootPath).then(datasets => {
                    this._datasets = datasets;
                    this._updateWebview(projectDetails?.lastConfig);
                }).catch(dsError => vscode.window.showErrorMessage(`Error loading datasets in show(): ${dsError.message}`));
            }).catch(error => {
                 vscode.window.showErrorMessage(`Error loading project data in show(): ${error.message}`);
                 // Fallback to loading datasets only
                 const datasetRootPath = path.join(this._workspacePath, 'dataset');
                 this.datasetService.loadDatasetsInWorkspace(datasetRootPath).then(datasets => {
                    this._datasets = datasets;
                    this._updateWebview(undefined);
                }).catch(dsError => vscode.window.showErrorMessage(`Error loading datasets in show(): ${dsError.message}`));
            });
        } else {
            // If no current project, load all datasets anyway or default state
            const datasetRootPath = path.join(this._workspacePath, 'dataset');
            this.datasetService.loadDatasetsInWorkspace(datasetRootPath).then(datasets => {
                this._datasets = datasets;
                this._updateWebview(undefined); // No specific project's last config
            }).catch(dsError => vscode.window.showErrorMessage(`Error loading datasets in show(): ${dsError.message}`));
        }
            
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
                        engine: this._currentProject.engine,
                        strategy: this._currentProject.strategy // Send strategy to webview
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
