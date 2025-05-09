import * as vscode from 'vscode';
import * as path from 'path';
import { Backtest, ProjectInfo } from './types';
import { BacktestResultView } from './backtestResultView';
import { Database } from './database';

export class ProjectTreeItem {
    id: string;
    label: string;
    children?: ProjectTreeItem[];
    contextValue?: string;
    projectInfo?: ProjectInfo;
    backtestResult?: Backtest;

    constructor(id: string, label: string, children?: ProjectTreeItem[], contextValue?: string, projectInfo?: ProjectInfo, backtestResult?: Backtest) {
        this.id = id;
        this.label = label;
        this.children = children;
        this.contextValue = contextValue;
        this.projectInfo = projectInfo;
        this.backtestResult = backtestResult;
    }
}

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
    private resultProvider: BacktestResultView;
    private db: Database;
    private data: ProjectTreeItem[] = [];
    private entryFileName: string = 'main.py';
    private backtraderTemplate: string = `import backtrader as bt

# strategy class definition
class MyStrategy(bt.Strategy):
    params = ()
    
    def __init__(self):
        pass
    
    def next(self):
        pass


# cerebro configuration
def cerebro_init(cerebro: bt.Cerebro):
    # data = bt.feeds.YahooFinanceData()
    # cerebro.adddata(data)
    pass


# no driver code needed
`;
    
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(_initialData: any[], extensionUri: vscode.Uri) {
        this.resultProvider = new BacktestResultView(extensionUri);
        this.db = Database.getInstance();
        this.loadProjects();
    }

    private async loadProjects(): Promise<void> {
        try {
            const projects = await this.db.getProjects();

            this.data = await Promise.all(projects.map(async (project: ProjectInfo) => {
                if (!project._id) {
                    vscode.window.showErrorMessage(`Project ID is missing: ${project.name}`);
                    return new ProjectTreeItem(
                        `project-${project.name}`,
                        project.name,
                        [],
                        'project',
                        project
                    );
                }

                const projectItem = new ProjectTreeItem(
                    project._id,
                    project.name,
                    [],
                    'project',
                    project
                );

                try {
                    // Add backtest results as children if available
                    const results = await this.db.getBacktestResults(project._id);
                    
                    if (results.length > 0) {
                        projectItem.children = results.map(result => {
                            const date = new Date(result.date);
                            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                            return new ProjectTreeItem(
                                result.id,
                                formattedDate,
                                [],
                                'backtestResult',
                                project,
                                result
                            );
                        });
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Error loading backtest results: ${error}`);
                }

                return projectItem;
            }));
            
            const entryFiles = projects.map((project: ProjectInfo) => path.join(project.path, project.entryFile));
            
            vscode.commands.executeCommand(
                'setContext', 
                'backtestManager.entryFiles', 
                entryFiles
            );

            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading project information: ${error}`);
            this.data = [];
            this.refresh();
        }
    }

    getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.label,
            element.children && element.children.length > 0 
                ? vscode.TreeItemCollapsibleState.Collapsed 
                : vscode.TreeItemCollapsibleState.None
        );
        
        treeItem.id = element.id;
        treeItem.tooltip = element.projectInfo ? 
            `Project: ${element.projectInfo.name}\nPath: ${element.projectInfo.path}\nEngine: ${element.projectInfo.engine}` :
            element.backtestResult ?
            `Backtest Result\nStrategy: ${element.backtestResult.strategy}\nTotal Return: ${(element.backtestResult.performance.totalReturn * 100).toFixed(2)}%` :
            `Tooltip for ${element.label}`;
        treeItem.contextValue = element.contextValue || 'treeItem';
        
        // Add command for backtest result items
        if (element.contextValue === 'backtestResult' && element.backtestResult) {
            treeItem.command = {
                command: 'myExtension.showBacktestResult',
                title: 'View Backtest Result',
                arguments: [element.backtestResult]
            };
        }
        
        return treeItem;
    }

    getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.data);
        }
        
        return Promise.resolve(element.children || []);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateData(): void {
        this.loadProjects();
    }

    async createNewProject(projectName: string): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder found.');
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const projectPath = path.join(rootPath, projectName);
            const entryFile = vscode.Uri.file(path.join(projectPath, this.entryFileName));
          
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(projectPath));
            await vscode.workspace.fs.writeFile(entryFile, Buffer.from(this.backtraderTemplate));

            const projectInfo: ProjectInfo = {
                name: projectName,
                path: projectPath,
                entryFile: this.entryFileName,
                engine: "backtrader"
            };

            await this.db.addProject(projectInfo);

            await this.loadProjects();

            vscode.window.showInformationMessage(`Project "${projectName}" created successfully.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating project: ${error}`);
        }
    }

    async getProjects(): Promise<ProjectInfo[]> {
        return this.db.getProjects();
    }

    async deleteBacktestResult(projectId: string, id: string): Promise<void> {
        try {
            await this.db.deleteBacktestResult(projectId, id);
            await this.loadProjects();
            vscode.window.showInformationMessage('Backtest result has been deleted.');
        } catch (error) {
            vscode.window.showErrorMessage(`Error deleting backtest result: ${error}`);
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        try {
            await this.db.deleteProject(projectId);
            await this.loadProjects();
            vscode.window.showInformationMessage('Project has been deleted.');
        } catch (error) {
            vscode.window.showErrorMessage(`Error deleting project: ${error}`);
        }
    }
}
