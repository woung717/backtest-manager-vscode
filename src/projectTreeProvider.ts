import * as vscode from 'vscode';
import * as path from 'path';
import { Backtest, Engine, ProjectInfo } from './types';
// import { Database } from './database'; // Removed
import { IProjectService } from './services/projectService'; // Added
// import { templateCodeFactory } from './userCodeTemplates'; // Will be used by ProjectService

export class ProjectTreeItem {
  id: string;
  label: string;
  children?: ProjectTreeItem[];
  contextValue?: string;
  projectInfo?: ProjectInfo; // Keep this to pass to commands or for tooltip
  backtestResult?: Backtest; // Keep this for commands or tooltip

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
  // private db: Database; // Removed
  private data: ProjectTreeItem[] = [
    new ProjectTreeItem('loading', 'Loading Projects...', undefined, undefined, undefined, undefined)
  ];
  // private entryFileName: string = 'main.py'; // Will be handled by ProjectService

  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined | null | void> = new vscode.EventEmitter<ProjectTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private projectService: IProjectService) { // Modified constructor
    // Trigger initial load async
    this.refresh().catch(error => {
      vscode.window.showErrorMessage(`Error during initial project load: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private async loadProjects(): Promise<void> {
    try {
      // projectService.getProjects() is expected to return ProjectInfo with 'results' (Backtest[]) populated.
      const projects = await this.projectService.getProjects();

      this.data = projects.map((project: ProjectInfo) => {
        if (!project._id) {
          // This should ideally not happen if service returns valid projects
          console.error(`Project ID is missing for project: ${project.name}`);
          // Create a fallback or skip
          return new ProjectTreeItem(project.name, `${project.name} (Error: Missing ID)`, [], 'projectError', project);
        }

        const projectItem = new ProjectTreeItem(
          project._id,
          project.name,
          [], // Children will be backtest results
          'project',
          project
        );

        if (project.results && project.results.length > 0) {
          projectItem.children = project.results.map(result => {
            const date = new Date(result.date);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
            return new ProjectTreeItem(
              result.id,
              formattedDate,
              [],
              'backtestResult',
              project, // Pass parent projectInfo
              result
            );
          });
        }
        return projectItem;
      });
      
      const entryFiles = projects
        .filter(p => p.path && p.entryFile) // Ensure path and entryFile exist
        .map((project: ProjectInfo) => path.join(project.path, project.entryFile));
        
      await vscode.commands.executeCommand(
        'setContext', 
        'backtestManager.entryFiles', 
        entryFiles
      );

      // Trigger tree view update after data is loaded
      this._onDidChangeTreeData.fire();
      
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading project information via ProjectService: ${error instanceof Error ? error.message : String(error)}`);
      this.data = [new ProjectTreeItem('error', 'Error loading projects', [], 'error')];
      this._onDidChangeTreeData.fire(); // Ensure error state is shown
    }
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.children && element.children.length > 0 
        ? vscode.TreeItemCollapsibleState.Collapsed 
        : vscode.TreeItemCollapsibleState.None
    );
    
    treeItem.id = element.id; // Important for VS Code to track items
    treeItem.contextValue = element.contextValue || 'treeItem';

    // Tooltip and command are set based on the item type
    if (element.contextValue === 'project' && element.projectInfo) {
      treeItem.tooltip = `Project: ${element.projectInfo.name}\nPath: ${element.projectInfo.path}\nEngine: ${element.projectInfo.engine}`;
    } else if (element.contextValue === 'backtestResult' && element.backtestResult) {
      treeItem.tooltip = `Backtest Result\nStrategy: ${element.backtestResult.strategy}\nTotal Return: ${(element.backtestResult.performance?.totalReturn * 100 || 0).toFixed(2)}%`;
      treeItem.command = {
        command: 'backtestManager.showBacktestResult',
        title: 'View Backtest Result',
        arguments: [element.backtestResult] // Pass the full backtest result
      };
      // treeItem.iconPath = new vscode.ThemeIcon('graph');
    } else if (element.contextValue === 'loading' || element.contextValue === 'error') {
        // treeItem.iconPath = new vscode.ThemeIcon(element.contextValue === 'loading' ? 'sync~spin' : 'error');
    } else {
      treeItem.tooltip = `Tooltip for ${element.label}`;
    }
    
    return treeItem;
  }

  getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.data);
    }
    return Promise.resolve(element.children || []);
  }

  public async refresh(): Promise<void> {
    await this.loadProjects(); // loadProjects now handles firing the event
  }

  async createNewProject(projectName: string, engine: Engine): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a folder to create a project.');
        return;
      }
      const workspaceRootPath = workspaceFolders[0].uri.fsPath;

      const newProjectInfo = await this.projectService.createProject(projectName, engine, workspaceRootPath);
      
      await this.loadProjects(); // Refresh the tree view

      const entryFilePath = vscode.Uri.file(path.join(newProjectInfo.path, newProjectInfo.entryFile));
      const document = await vscode.workspace.openTextDocument(entryFilePath);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
      
      vscode.window.showInformationMessage(`Project "${projectName}" created successfully.`);

    } catch (error) {
      vscode.window.showErrorMessage(`Error creating project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async openEntryFile(project: ProjectInfo): Promise<void> {
    if (!project || !project.path || !project.entryFile) {
        vscode.window.showErrorMessage('Project information is incomplete, cannot open entry file.');
        return;
    }
    try {
        const entryFilePath = vscode.Uri.file(path.join(project.path, project.entryFile));
        const document = await vscode.workspace.openTextDocument(entryFilePath);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    } catch (error) {
        vscode.window.showErrorMessage(`Error opening entry file ${project.entryFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async renameProject(item: ProjectTreeItem, newName: string): Promise<void> { // Takes ProjectTreeItem
    if (!item.projectInfo || !item.projectInfo._id) {
      vscode.window.showErrorMessage('Invalid project item for rename.');
      return;
    }
    try {
      const updatedProject = await this.projectService.updateProject(item.projectInfo._id, { name: newName });
      if (updatedProject) {
        await this.loadProjects(); // Refresh tree
        vscode.window.showInformationMessage(`Project "${item.projectInfo.name}" renamed to "${newName}".`);
      } else {
        vscode.window.showErrorMessage(`Failed to rename project "${item.projectInfo.name}". Project not found or update failed.`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error renaming project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Removed getProjects() as it was a direct db passthrough. Data is loaded via loadProjects.

  async deleteBacktestResult(item: ProjectTreeItem): Promise<void> { // Takes ProjectTreeItem
    if (!item.projectInfo || !item.projectInfo._id || !item.backtestResult) {
      vscode.window.showErrorMessage('Invalid backtest result item for deletion.');
      return;
    }
    try {
      // The service now returns the updated project or null.
      const updatedProject = await this.projectService.deleteBacktestResult(item.projectInfo._id, item.backtestResult.id);
      if (updatedProject !== undefined) { // Check if service call was successful (null means success but no specific project, true could also work for boolean returns)
        await this.loadProjects(); // Refresh tree
        vscode.window.showInformationMessage('Backtest result has been deleted.');
      } else {
         vscode.window.showInformationMessage('Backtest result deleted. Project data may have been updated.'); // Or specific error if service throws
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error deleting backtest result: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteProject(item: ProjectTreeItem): Promise<void> { // Takes ProjectTreeItem
    if (!item.projectInfo || !item.projectInfo._id) {
      vscode.window.showErrorMessage('Invalid project item for deletion.');
      return;
    }
    try {
      const success = await this.projectService.deleteProject(item.projectInfo._id);
      if (success) {
        await this.loadProjects(); // Refresh tree
        vscode.window.showInformationMessage(`Project "${item.projectInfo.name}" has been deleted.`);
      } else {
        vscode.window.showErrorMessage(`Failed to delete project "${item.projectInfo.name}".`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error deleting project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
