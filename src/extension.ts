import * as vscode from 'vscode';
import { ProjectTreeProvider, ProjectTreeItem } from './projectTreeProvider';
import { BacktestSettingView } from './backtestSettingView';
import { ExtensionServer } from './server';
import * as path from 'path';
import { BacktestResultView } from './backtestResultView';
import { Backtest, DatasetInfo, Engine } from './types';
import { DatasetTreeProvider, DatasetTreeItem } from './datasetTreeProvider';
import { DatasetDownloaderView } from './datasetDownloaderView';
import { VSCodeOutputLogger } from './vscodeOutputLogger';

/**
 * This function logs the extension logo to the output channel.
 */
function printLogo(logger: VSCodeOutputLogger) {
    // Print logo
    logger.log(`
        ██████╗  █████╗  ██████╗██╗  ██╗████████╗███████╗███████╗████████╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ 
        ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗
        ██████╔╝███████║██║     █████╔╝    ██║   █████╗  ███████╗   ██║       ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝
        ██╔══██╗██╔══██║██║     ██╔═██╗    ██║   ██╔══╝  ╚════██║   ██║       ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗
        ██████╔╝██║  ██║╚██████╗██║  ██╗   ██║   ███████╗███████║   ██║       ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║
        ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
        `);
        
    logger.log('Extension "my-vscode-extension" is now active!');
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    const logger = VSCodeOutputLogger.getInstance("Backtest Manager");
    printLogo(logger);

    // Get workspace path
    let workspacePath = '';
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
        vscode.window.showErrorMessage('Workspace folder is not open.');
        return;
    }

    // Start the extension server
    const server = new ExtensionServer();
    let serverPort: number;
    
    // Start the server and store the server port for later use
    server.start()
        .then(port => { serverPort = port; })
        .catch(error => {
            vscode.window.showErrorMessage(`Failed to start extension server: ${error.message}`);
        });

    // Make sure to stop the server when the extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            server.stop()
                .then(() => console.log('Extension server stopped'))
                .catch(err => console.error('Error stopping server:', err));
        }
    });

    // Sample data for the tree view
    const sampleData: any[] = [];

    // Register tree view
    const projectTreeProvider = new ProjectTreeProvider(sampleData, context.extensionUri);
    const projectTreeView = vscode.window.createTreeView('myExtensionTreeView', { 
        treeDataProvider: projectTreeProvider
    });

    // Register tree view selection change event
    projectTreeView.onDidChangeSelection(async (event) => {
        if (event.selection.length > 0) {
            const item = event.selection[0];
            if (item.projectInfo) {
                // open project entry file
                const entryFilePath = vscode.Uri.file(path.join(item.projectInfo.path, item.projectInfo.entryFile));
                const document = await vscode.workspace.openTextDocument(entryFilePath);
                await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            }
        }
    });

    context.subscriptions.push(projectTreeView);

    // Register dataset tree view
    const datasetTreeProvider = new DatasetTreeProvider(workspacePath);
    const datasetTreeView = vscode.window.createTreeView('myDatasetTreeView', { 
        treeDataProvider: datasetTreeProvider
    });
    context.subscriptions.push(datasetTreeView);

    // Register sidebar panel provider
    const backtestSettingView = new BacktestSettingView(context.extensionUri, projectTreeProvider);
    context.subscriptions.push(
        vscode.commands.registerCommand('myExtension.showBacktestSettings', () => {
            backtestSettingView.show();
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('myExtension.refreshTreeView', () => {
            projectTreeProvider.updateData();
        }),

        // Add command to create new project
        vscode.commands.registerCommand('myExtension.createNewProject', async () => {
            const projectName = await vscode.window.showInputBox({
                placeHolder: 'Enter project name',
                prompt: 'Create New Project',
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
        vscode.commands.registerCommand('myExtension.runBacktest', async () => {
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
        vscode.commands.registerCommand('myExtension.runBacktestFromTree', async (item: ProjectTreeItem) => {
            if (item.projectInfo) {
                await backtestSettingView.openBacktestSetting(item.projectInfo.name);
            }
        }),

        // Add command to check server status
        vscode.commands.registerCommand('myExtension.checkServerStatus', async () => {
            try {
                const response = await fetch(`http://localhost:${serverPort}/status`);
                const result = await response.text();
                vscode.window.showInformationMessage(`Server status: ${result}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error checking server status: ${error.message}`);
            }
        }),

        // Add commands for editing settings
        vscode.commands.registerCommand('myExtension.editStartDate', async (currentValue: string) => {
            const value = await vscode.window.showInputBox({
                value: currentValue,
                prompt: 'Enter start date (YYYY-MM-DD)',
                validateInput: (value) => {
                    if (!value) return 'Start date cannot be empty';
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Invalid date format (YYYY-MM-DD)';
                    return null;
                }
            });
        }),

        vscode.commands.registerCommand('myExtension.editEndDate', async (currentValue: string) => {
            const value = await vscode.window.showInputBox({
                value: currentValue,
                prompt: 'Enter end date (YYYY-MM-DD)',
                validateInput: (value) => {
                    if (!value) return 'End date cannot be empty';
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Invalid date format (YYYY-MM-DD)';
                    return null;
                }
            });
        }),

        // Add command to show backtest result
        vscode.commands.registerCommand('myExtension.showBacktestResult', (backtest: Backtest) => {
            const resultView = new BacktestResultView(context.extensionUri);
            resultView.showResult(backtest);
        }),

        // Add command to delete backtest result
        vscode.commands.registerCommand('myExtension.deleteBacktestResult', async (item) => {
            if (item.backtestResult && item.projectInfo && item.projectInfo._id) {
                const result = await vscode.window.showWarningMessage('Are you sure you want to delete this backtest result?', { modal: true }, 'Delete');
                if (result === 'Delete') {
                    await projectTreeProvider.deleteBacktestResult(item.projectInfo._id, item.backtestResult.id);
                }
            }
        }),

        // Add command to delete project
        vscode.commands.registerCommand('myExtension.deleteProject', async (item) => {
            if (item.projectInfo && item.projectInfo._id) {
                const result = await vscode.window.showWarningMessage('Are you sure you want to delete this project? (Project folder will remain)', { modal: true }, 'Delete');
                if (result === 'Delete') {
                    await projectTreeProvider.deleteProject(item.projectInfo._id);
                }
            }
        }),

        // Dataset management commands
        vscode.commands.registerCommand('myExtension.refreshDatasetView', () => {
            datasetTreeProvider.updateData();
        }),

        vscode.commands.registerCommand('myExtension.deleteDataset', async (item: DatasetTreeItem) => {
            if (item.dataset) {
                await datasetTreeProvider.deleteDataset(item.dataset);
            }
        }),

        vscode.commands.registerCommand('myExtension.openDatasetFile', async (dataset: DatasetInfo) => {
            try {
                const document = await vscode.workspace.openTextDocument(dataset.path);
                await vscode.window.showTextDocument(document);
            } catch (error) {
                vscode.window.showErrorMessage(`Cannot open file: ${error}`);
            }
        }),

        // Add command to show dataset downloader webview for specific asset type
        vscode.commands.registerCommand('myExtension.showDatasetDownloader', (item: DatasetTreeItem) => {
            if (item.assetType) {
                const downloader = new DatasetDownloaderView(context.extensionUri, item.assetType, workspacePath);
                downloader.show();
            }
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
