
import * as vscode from 'vscode';
import { BacktestResultView } from './backtestResultView';
import { ProjectInfo, DatasetInfo } from './types';
import { ProjectTreeProvider } from './projectTreeProvider';
import * as path from 'path';

import { IProjectService } from './services/projectService';
import { IDatasetService } from './services/datasetService';
import { IPythonEnvironmentService } from './services/pythonEnvironmentService';
import { IBacktestService, BacktestRunConfig } from './services/backtestService';



export class BacktestSettingView {
  private _extensionUri: vscode.Uri;
  private _currentProject?: ProjectInfo;
  private _resultProvider: BacktestResultView; 
  private _panel?: vscode.WebviewPanel;
  private _treeProvider: ProjectTreeProvider;
  private _datasets: DatasetInfo[] = [];

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
    backtestService: IBacktestService, 
  ) {
    this._extensionUri = extensionUri;
    this._resultProvider = new BacktestResultView(extensionUri); 
    this._treeProvider = treeProvider;
    this.projectService = projectService;
    this.datasetService = datasetService;
    this.pythonEnvService = pythonEnvService;
    this.backtestService = backtestService;
  }

  public async openBacktestSetting(projectName: string) {
    const project = await this.projectService.getProjectByName(projectName);

    if (project && project._id) { 
      const entryFilePath = vscode.Uri.joinPath(vscode.Uri.file(project.path), project.entryFile);
      try {
        await vscode.workspace.fs.stat(entryFilePath);
      } catch {
        vscode.window.showErrorMessage(`Project entry file "${project.entryFile}" not found at ${project.path}.`);
        return;
      }

      this._currentProject = project;
      this._datasets = await this.datasetService.loadDatasetsInWorkspace();

      const fullProject = await this.projectService.getProject(project._id);
      const lastConfig = fullProject?.lastConfig;

      // Check engine library
      const pythonPath = await this.pythonEnvService.getPythonPath();
      if (pythonPath) {
        const engineLib = project.engine;
        if (engineLib && engineLib !== 'custom') {
          const isInstalled = await this.pythonEnvService.checkLibraryInstalled(pythonPath, engineLib);
          if (!isInstalled) {
            vscode.window.showErrorMessage(`${engineLib} library is not installed. Please install it (e.g., 'pip install ${engineLib}')`);
          }
        }
      } else {
        vscode.window.showWarningMessage('Python path not configured. Cannot check engine libraries.');
      }

      this.show(); 
      this._updateWebview(lastConfig); 
    } else {
      vscode.window.showErrorMessage(`Project "${projectName}" not found.`);
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
            case 'runBacktest':{ 
              if (!this._currentProject || !this._currentProject._id) {
                vscode.window.showErrorMessage('Please select a project.');
                return;
              }

              if (!this._currentProject || !this._currentProject._id) {
                vscode.window.showErrorMessage('Current project is not properly set. Cannot run backtest.');
                return;
              }
              const currentProjectId = this._currentProject._id;

              try {
                const result = await this.backtestService.runBacktest(currentProjectId, data.config as BacktestRunConfig);

                const resultToStore = { ...result, config: data.config };

                await this.projectService.addBacktestResult(currentProjectId, resultToStore);
                await this.projectService.updateLastConfig(currentProjectId, data.config);

                this._resultProvider.showResult(resultToStore);
                this._treeProvider.refresh();
              } catch (error: any) {
                vscode.window.showErrorMessage(`Error occurred during backtest execution: ${error.message || error}`);
              }
              break; 
            }
            case 'refresh': { 
              this._datasets = await this.datasetService.loadDatasetsInWorkspace();

              let lastConfigRefresh = undefined;
              if (this._currentProject && this._currentProject._id) {
                const projectDetails = await this.projectService.getProject(this._currentProject._id);
                lastConfigRefresh = projectDetails?.lastConfig;
              }
              this._updateWebview(lastConfigRefresh); // Call _updateWebview with the potentially updated lastConfig
              break; 
            }
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

    if (this._currentProject && this._currentProject._id) {
      this.projectService.getProject(this._currentProject._id).then(projectDetails => {
        this.datasetService.loadDatasetsInWorkspace().then(datasets => {
          this._datasets = datasets;
          this._updateWebview(projectDetails?.lastConfig);
        }).catch(dsError => vscode.window.showErrorMessage(`Error loading datasets in show(): ${dsError.message}`));
      }).catch(error => {
        vscode.window.showErrorMessage(`Error loading project data in show(): ${error.message}`);
        this.datasetService.loadDatasetsInWorkspace().then(datasets => {
          this._datasets = datasets;
          this._updateWebview(undefined);
        }).catch(dsError => vscode.window.showErrorMessage(`Error loading datasets in show(): ${dsError.message}`));
      });
    } else {
      this.datasetService.loadDatasetsInWorkspace().then(datasets => {
        this._datasets = datasets;
        this._updateWebview(undefined);
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
