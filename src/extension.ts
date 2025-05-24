import * as vscode from 'vscode';
import * as path from 'path';

// UI Components
import { ProjectTreeProvider, ProjectTreeItem } from './projectTreeProvider';
import { DatasetTreeProvider, DatasetTreeItem } from './datasetTreeProvider';
import { BacktestSettingView } from './backtestSettingView';
import { BacktestResultView } from './backtestResultView';
import { DatasetDownloaderView } from './datasetDownloaderView';
import { PriceChartView } from './priceChartView';

// Services
import { Database } from './database'; // Still needed for instantiation
import { ProjectService } from './services/projectService';
import { DatasetService } from './services/datasetService';
import { PythonEnvironmentService } from './services/pythonEnvironmentService';
import { BacktestService } from './services/backtestService';

// Types
import { Backtest, DatasetInfo, Engine, ProjectInfo } from './types'; // Added ProjectInfo explicitly

// Utilities
import { VSCodeOutputLogger } from './vscodeOutputLogger';


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

  // Get workspace path
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Workspace folder is not open. Please open a folder to use Backtest Manager.');
    return;
  }
  const workspacePath = workspaceFolders[0].uri.fsPath;

  // Instantiate Database (used by ProjectService)
  const database = Database.getInstance(workspacePath);

  // Instantiate Services
  const projectService = new ProjectService(database, workspacePath); // Assuming constructor updated
  const datasetService = new DatasetService(workspacePath);
  const pythonEnvService = new PythonEnvironmentService();
  const backtestService = new BacktestService(pythonEnvService, projectService); // Assuming constructor updated

  // Instantiate UI Providers/Views with injected services
  const projectTreeProvider = new ProjectTreeProvider(projectService);
  const datasetTreeProvider = new DatasetTreeProvider(datasetService, workspacePath);
  const backtestSettingView = new BacktestSettingView(
    context.extensionUri, 
    projectTreeProvider, 
    projectService, 
    datasetService, 
    pythonEnvService, 
    backtestService, 
    workspacePath
  );

  // Register Tree Views
  const projectTreeView = vscode.window.createTreeView('projectTreeView', { treeDataProvider: projectTreeProvider });
  context.subscriptions.push(projectTreeView);
  projectTreeView.onDidChangeSelection(async (event) => {
    if (event.selection.length > 0) {
      const item = event.selection[0] as ProjectTreeItem; // Cast for type safety
      if (item.projectInfo) {
        try {
          await projectTreeProvider.openEntryFile(item.projectInfo);
        } catch (e: any) {
          vscode.window.showErrorMessage(`Error opening entry file: ${e.message}`);
        }
      }
    }
  });

  const datasetTreeView = vscode.window.createTreeView('datasetTreeView', { treeDataProvider: datasetTreeProvider });
  context.subscriptions.push(datasetTreeView);
  
  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('backtestManager.refreshProjectTreeView', () => {
      projectTreeProvider.updateData(); // This method should call loadProjects which uses projectService
    }),

    vscode.commands.registerCommand('backtestManager.createNewProject', async () => {
      const projectName = await vscode.window.showInputBox({
        placeHolder: 'Enter project name',
        prompt: 'Create New Project',
        validateInput: async (value) => {
          if (!value) return 'Project name cannot be empty.';
          if (value.includes('/') || value.includes('\\')) return 'Project name cannot contain path separators.';
          try {
            const project = await projectService.getProjectByName(value); // Use service
            if (project) return 'Project name already exists.';
          } catch (e: any) {
            // This might happen if DB isn't initialized or service fails.
            // For validation, perhaps a softer check or ensure service handles this gracefully.
            console.error("Validation error checking project name:", e.message);
            return "Error validating project name."; 
          }
          return null;
        }
      });
      
      const engineSelection = await vscode.window.showQuickPick([
        { label: '🚀 Backtrader', value: 'backtrader' as Engine, description: 'Full featured event-driven backtesting engine.' },
        { label: '⚡ VectorBT', value: 'vectorbt' as Engine, description: 'Ultra rapid vectorized backtesting engine.' }
      ], { placeHolder: 'Select engine' });

      if (projectName && engineSelection) {
        try {
          const projectInfo = await projectService.createProject(projectName, engineSelection.value, workspacePath);
          projectTreeProvider.updateData(); // Refresh tree
          const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(projectInfo.path, projectInfo.entryFile)));
          await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        } catch (e: any) {
          vscode.window.showErrorMessage(`Failed to create project: ${e.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.runBacktest', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }
      const filePath = activeEditor.document.uri.fsPath;
      try {
        const projects = await projectService.getProjects(); // Use service
        const project = projects.find(p => path.join(p.path, p.entryFile) === filePath);
        if (!project) {
          vscode.window.showErrorMessage('This file is not the entryFile of a known backtest project.');
          return;
        }
        await backtestSettingView.openBacktestSetting(project.name);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Error preparing to run backtest: ${e.message}`);
      }
    }),

    vscode.commands.registerCommand('backtestManager.runBacktestFromTree', async (item: ProjectTreeItem) => {
      if (item.projectInfo) {
        try {
          await backtestSettingView.openBacktestSetting(item.projectInfo.name);
          // projectTreeProvider.openEntryFile(item.projectInfo); // This is still fine as it's a UI concern
          // If openEntryFile is complex, it could also be a command. For now, keep as is.
          await projectTreeProvider.openEntryFile(item.projectInfo);
        } catch (e: any) {
           vscode.window.showErrorMessage(`Error opening backtest settings: ${e.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.showBacktestResult', (backtest: Backtest) => {
      // BacktestResultView does not have external service dependencies in its constructor
      const resultView = new BacktestResultView(context.extensionUri);
      resultView.showResult(backtest);
    }),

    vscode.commands.registerCommand('backtestManager.showPriceChart', (item: ProjectTreeItem) => {
      if (item.backtestResult && item.projectInfo?.path && item.backtestResult.config?.datasetPaths?.[0]) {
        const chartView = new PriceChartView(context.extensionUri, datasetService);
        chartView.showPriceChart(item.backtestResult);
      } else if (item.projectInfo && !item.backtestResult) { // Assuming a project item could be right-clicked to show a chart of its primary dataset
         vscode.window.showWarningMessage("This command is for backtest results. Use 'Show Dataset Chart' for raw datasets.");
      }
    }),

    vscode.commands.registerCommand('backtestManager.deleteBacktestResult', async (item: ProjectTreeItem) => {
      if (item.backtestResult && item.projectInfo && item.projectInfo._id) {
        const confirmation = await vscode.window.showWarningMessage('Are you sure you want to delete this backtest result?', { modal: true }, 'Delete');
        if (confirmation === 'Delete') {
          try {
            await projectService.deleteBacktestResult(item.projectInfo._id, item.backtestResult.id);
            projectTreeProvider.updateData(); // Refresh tree
          } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to delete backtest result: ${e.message}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.renameProject', async (item: ProjectTreeItem) => {
      const newProjectName = await vscode.window.showInputBox({
        placeHolder: 'Enter new project name',
        prompt: 'Rename Project',
        value: item.projectInfo?.name, // Pre-fill with current name
        validateInput: (value) => {
          if (!value) return 'Project name cannot be empty';
          if (value.includes('/') || value.includes('\\')) return 'Project name cannot contain path separators';
          return null;
        }
      });

      if (newProjectName && item.projectInfo && item.projectInfo._id) {
        try {
          await projectService.updateProject(item.projectInfo._id, { name: newProjectName });
          projectTreeProvider.updateData(); // Refresh tree
        } catch (e: any) {
          vscode.window.showErrorMessage(`Failed to rename project: ${e.message}`);
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.deleteProject', async (item: ProjectTreeItem) => {
      if (item.projectInfo && item.projectInfo._id) {
        const confirmation = await vscode.window.showWarningMessage(
          `Are you sure you want to delete the project "${item.projectInfo.name}"? This action only removes it from the manager, the folder remains.`, 
          { modal: true }, 
          'Delete'
        );
        if (confirmation === 'Delete') {
          try {
            await projectService.deleteProject(item.projectInfo._id);
            projectTreeProvider.updateData(); // Refresh tree
          } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to delete project: ${e.message}`);
          }
        }
      }
    }),

    vscode.commands.registerCommand('backtestManager.refreshDatasetView', () => {
      datasetTreeProvider.updateData(); // This method should call loadDatasets which uses datasetService
    }),

    vscode.commands.registerCommand('backtestManager.showDatasetChart', async (item: DatasetTreeItem) => {
      if (item.datasetInfo && item.datasetInfo.path) { // Updated to datasetInfo
        const chartView = new PriceChartView(context.extensionUri, datasetService);
        chartView.showDatasetOnlyPriceChart(item.datasetInfo.path);    
      }
    }),

    vscode.commands.registerCommand('backtestManager.deleteDataset', async (item: DatasetTreeItem) => {
      // datasetTreeProvider.deleteDataset already handles confirmation and service call
      if (item.datasetInfo) { // Check if it's a dataset item
         await datasetTreeProvider.deleteDataset(item); 
      } else {
         vscode.window.showWarningMessage("Please select a dataset file to delete.");
      }
    }),

    vscode.commands.registerCommand('backtestManager.openDataset', async (dataset: DatasetInfo) => {
      try {
        const document = await vscode.workspace.openTextDocument(dataset.path);
        await vscode.window.showTextDocument(document);
      } catch (error: any) {
        vscode.window.showErrorMessage(`Cannot open file: ${error.message || error}`);
      }
    }),

    vscode.commands.registerCommand('backtestManager.showDatasetDownloader', (item: DatasetTreeItem) => {
      if (item.assetType) {
        const downloaderView = new DatasetDownloaderView(context.extensionUri, item.assetType, datasetService);
        downloaderView.show();
      }
    }),
    
    vscode.commands.registerCommand('backtestManager.showBacktestSettings', () => {
      // This command might need a context, e.g., currently selected project or last active.
      // For now, if it's a general command, it might open with no project selected or last selected.
      // The current backtestSettingView.show() might need adaptation if it expects a project.
      // Assuming backtestSettingView.show() can handle being opened without a specific project initially,
      // or it's meant to be triggered when a project context is already known (e.g. via runBacktest command).
      // If it must have a project, this command might need to prompt for one.
      // For simplicity, we'll assume it can be shown and user selects project in its UI or it uses last active.
      backtestSettingView.show(); 
    }),

    vscode.commands.registerCommand('backtestManager.feedback', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://forms.gle/pRwpMMrS66sBmHdE9'));
    })
  );
}

export function deactivate() {
  // Ensure Database.getInstance() is called with workspacePath if it's needed for saving.
  // However, if Database is only used via ProjectService, ProjectService should handle saving if necessary.
  // For now, assuming Database might have its own shutdown logic.
  // This needs to be consistent with how Database is designed.
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspacePath = workspaceFolders[0].uri.fsPath;
    Database.getInstance(workspacePath).saveDatabase(); // Ensure path is passed if required by getInstance for saving
  } else {
    // Handle case where there's no workspace, maybe database doesn't need saving or was never initialized.
    console.warn("No workspace folder found during deactivation. Database might not be saved if path-dependent.");
  }
}
