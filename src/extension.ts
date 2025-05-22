import * as vscode from 'vscode';
import { ProjectTreeProvider, ProjectTreeItem } from './projectTreeProvider';
import { BacktestSettingView } from './backtestSettingView';
import * as path from 'path';
import { BacktestResultView } from './backtestResultView';
import { Backtest, DatasetInfo, Engine } from './types';
import { DatasetTreeProvider, DatasetTreeItem } from './datasetTreeProvider';
import { DatasetDownloaderView } from './datasetDownloaderView';
import { VSCodeOutputLogger } from './vscodeOutputLogger';
import { Database } from './database';
import { Backtester } from './backtester';
import { PriceChartView } from './priceChartView';

function printLogo(logger: VSCodeOutputLogger) {

  logger.log(`
    ██████╗  █████╗  ██████╗██╗  ██╗████████╗███████╗███████╗████████╗  ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ 
    ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝  ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗
    ██████╔╝███████║██║   █████╔╝  ██║   █████╗  ███████╗   ██║     ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝
    ██╔══██╗██╔══██║██║   ██╔═██╗  ██║   ██╔══╝  ╚════██║   ██║     ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗
    ██████╔╝██║  ██║╚██████╗██║  ██╗   ██║   ███████╗███████║   ██║     ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║
    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝   ╚═╝     ╚═╝   ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
    `);
}

export function activate(context: vscode.ExtensionContext) {
  const logger = VSCodeOutputLogger.getInstance("Backtest Manager");

  printLogo(logger);

  Backtester.getPythonPath();

  // Get workspace path
  let workspacePath = '';
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  } else {
    vscode.window.showErrorMessage('Workspace folder is not open.');
    return;
  }

  // Sample data for the tree view
  const sampleData: any[] = [];

  // Register tree view
  const projectTreeProvider = new ProjectTreeProvider(sampleData, context.extensionUri);
  const projectTreeView = vscode.window.createTreeView('projectTreeView', { 
    treeDataProvider: projectTreeProvider
  });

  // Register tree view selection change event
  projectTreeView.onDidChangeSelection(async (event) => {
    if (event.selection.length > 0) {
      const item = event.selection[0];
      if (item.projectInfo) {
      projectTreeProvider.openEntryFile(item.projectInfo);
    }
    }
  });

  context.subscriptions.push(projectTreeView);

  // Register dataset tree view
  const datasetTreeProvider = new DatasetTreeProvider(workspacePath);
  const datasetTreeView = vscode.window.createTreeView('datasetTreeView', { 
    treeDataProvider: datasetTreeProvider
  });
  context.subscriptions.push(datasetTreeView);

  // Register sidebar panel provider
  const backtestSettingView = new BacktestSettingView(context.extensionUri, projectTreeProvider);
  context.subscriptions.push(
    vscode.commands.registerCommand('backtestManager.showBacktestSettings', () => {
      backtestSettingView.show();
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('backtestManager.refreshProjectTreeView', () => {
      projectTreeProvider.updateData();
    }),

    // Add command to create new project
    vscode.commands.registerCommand('backtestManager.createNewProject', async () => {
      const projectName = await vscode.window.showInputBox({
        placeHolder: 'Enter project name',
        prompt: 'Create New Project',
        validateInput: async (value) => {
          if (!value) {
            return 'Project name cannot be empty.';
          }

          if (value.includes('/') || value.includes('\\')) {
            return 'Project name cannot contain path separators.';
          }

          const project = await Database.getInstance().getProjectByName(value);
          if (project) {
            return 'Project name already exists.';
          }

          return null;
        }
      });
      
      const engine = await vscode.window.showQuickPick([
        { label: '🚀 Backtrader', value: 'backtrader', description: 'Full featured event-driven backtesting engine.' },
        { label: '⚡ VectorBT', value: 'vectorbt', description: 'Ultra rapid vectorized backtesting engine.' }
      ], {
        placeHolder: 'Select engine',
      });

      if (projectName && engine) {
        await projectTreeProvider.createNewProject(projectName, engine.value as Engine);
      }
    }),

    // Add command to run backtest
    vscode.commands.registerCommand('backtestManager.runBacktest', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }

      const filePath = activeEditor.document.uri.fsPath;
      
      // Check if the current file is the entryFile of a project
      const projects = await projectTreeProvider.getProjects();
      const project = projects.find(p => path.join(p.path, p.entryFile) === filePath);
      
      if (!project) {
        vscode.window.showErrorMessage('This file is not the entryFile of a backtest project.');
        return;
      }

      // Open Backtest Settings panel
      await backtestSettingView.openBacktestSetting(project.name);
    }),

    // Run backtest from TreeView context menu
    vscode.commands.registerCommand('backtestManager.runBacktestFromTree', async (item: ProjectTreeItem) => {
      if (item.projectInfo) {
        backtestSettingView.openBacktestSetting(item.projectInfo.name);
      }
    }),

    // Add command to show backtest result
    vscode.commands.registerCommand('backtestManager.showBacktestResult', (backtest: Backtest) => {
      const resultView = new BacktestResultView(context.extensionUri);
      resultView.showResult(backtest);
    }),

    vscode.commands.registerCommand('backtestManager.showPriceChart', (item: ProjectTreeItem) => {
      if (item.backtestResult) {
        const resultView = new PriceChartView(context.extensionUri);
        resultView.showPriceChart(item.backtestResult);
      }
    }),

    // Add command to delete backtest result
    vscode.commands.registerCommand('backtestManager.deleteBacktestResult', async (item) => {
      if (item.backtestResult && item.projectInfo && item.projectInfo._id) {
        const result = await vscode.window.showWarningMessage('Are you sure you want to delete this backtest result?', { modal: true }, 'Delete');
        if (result === 'Delete') {
          await projectTreeProvider.deleteBacktestResult(item.projectInfo._id, item.backtestResult.id);
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.renameProject', async (item: ProjectTreeItem) => {
      const projectName = await vscode.window.showInputBox({
        placeHolder: 'Enter new project name',
        prompt: 'Rename Project',
        validateInput: (value) => {
          if (!value) {
            return 'Project name cannot be empty';
          }
          if (value.includes('/') || value.includes('\\')) {
            return 'Project name cannot contain path separators';
          }
          return null;
        }
      });

      if (!projectName) {
        vscode.window.showErrorMessage('Project name cannot be empty');
        return;
      }

      if (item.projectInfo && item.projectInfo._id) {
        await projectTreeProvider.renameProject(item.projectInfo._id, projectName);
      }
    }),

    // Add command to delete project
    vscode.commands.registerCommand('backtestManager.deleteProject', async (item) => {
      if (item.projectInfo && item.projectInfo._id) {
        const result = await vscode.window.showWarningMessage('Are you sure you want to delete this project? (Project folder will remain)', { modal: true }, 'Delete');
        if (result === 'Delete') {
          await projectTreeProvider.deleteProject(item.projectInfo._id);
        }
      }
    }),

    // Dataset management commands
    vscode.commands.registerCommand('backtestManager.refreshDatasetView', () => {
      datasetTreeProvider.updateData();
    }),

    vscode.commands.registerCommand('backtestManager.showDatasetChart', async (item: DatasetTreeItem) => {
      if (item.dataset) {
        const resultView = new PriceChartView(context.extensionUri);
        resultView.showDatasetOnlyPriceChart(item.dataset.path);    
      }
    }),

    vscode.commands.registerCommand('backtestManager.deleteDataset', async (item: DatasetTreeItem) => {
      if (item.dataset) {
        await datasetTreeProvider.deleteDataset(item.dataset);
      }
    }),

    vscode.commands.registerCommand('backtestManager.openDataset', async (dataset: DatasetInfo) => {
      try {
        const document = await vscode.workspace.openTextDocument(dataset.path);
        await vscode.window.showTextDocument(document);
      } catch (error) {
        vscode.window.showErrorMessage(`Cannot open file: ${error}`);
      }
    }),

    // Add command to show dataset downloader webview for specific asset type
    vscode.commands.registerCommand('backtestManager.showDatasetDownloader', (item: DatasetTreeItem) => {
      if (item.assetType) {
        const downloader = new DatasetDownloaderView(context.extensionUri, item.assetType, workspacePath);
        downloader.show();
      }
    }),

    vscode.commands.registerCommand('backtestManager.feedback', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://forms.gle/pRwpMMrS66sBmHdE9'));
    })

  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  Database.getInstance().saveDatabase();
}
