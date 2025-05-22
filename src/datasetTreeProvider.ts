import * as vscode from 'vscode';
import * as path from 'path';
import { DatasetInfo } from './types';

export class DatasetTreeItem {
  id: string;
  label: string;
  children?: DatasetTreeItem[];
  contextValue?: string;
  dataset?: DatasetInfo;
  isFolder: boolean;
  assetType?: 'crypto' | 'stock' | 'forex';

  constructor(
    id: string, 
    label: string, 
    isFolder: boolean = false,
    children?: DatasetTreeItem[], 
    contextValue?: string, 
    dataset?: DatasetInfo,
    assetType?: 'crypto' | 'stock' | 'forex'
  ) {
    this.id = id;
    this.label = label;
    this.children = children;
    this.contextValue = contextValue;
    this.dataset = dataset;
    this.isFolder = isFolder;
    this.assetType = assetType;
  }
}

export class DatasetTreeProvider implements vscode.TreeDataProvider<DatasetTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DatasetTreeItem | undefined | null | void> = new vscode.EventEmitter<DatasetTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DatasetTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private datasetRoot: string = '';
  private data: DatasetTreeItem[] = [
    new DatasetTreeItem('loading', 'Loading Datasets...')
  ];

  constructor(private workspaceRoot: string) {
    this.datasetRoot = path.join(workspaceRoot, 'dataset');
    this.loadDatasets();
  }

  private async ensureDatasetFolders(): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(this.datasetRoot));

    const assetFolders = ['crypto']; // 'stock', 'forex'
    for (const folder of assetFolders) {
      const folderPath = path.join(this.datasetRoot, folder);
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));
    }
  }

  private async loadDatasets(): Promise<void> {
    await this.ensureDatasetFolders();

    try {
      const assetTypes = ['crypto']; // and 'stock', 'forex' in the future
      this.data = await Promise.all(assetTypes.map(async assetType => {
        const folderPath = path.join(this.datasetRoot, assetType);
        const children = await this.getDatasetFilesFromFolder(folderPath, assetType);
        
        return new DatasetTreeItem(
          `folder-${assetType}`,
          assetType,
          true,
          children,
          'assetFolder',
          undefined,
          assetType as 'crypto' | 'stock' | 'forex'
        );
      }));

      this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading datasets: ${error}`);
      this.data = [];
      this.refresh();
    }
  }

  private async getDatasetFilesFromFolder(folderPath: string, assetType: string): Promise<DatasetTreeItem[]> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
    } catch (error) {
      return [];
    }

    const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));

    return files.map(file => file[0])
      .filter(fileName => fileName.endsWith('.csv') || fileName.endsWith('.json'))
      .map(fileName => {
        const filePath = path.join(folderPath, fileName);
        
        const nameParts = path.basename(fileName, path.extname(fileName)).split('_');
        const exchange = nameParts[0] || 'Unknown';
        const symbol = nameParts[1] || 'Unknown';
        const timeframe = nameParts[2] || 'Unknown';
        
        const dataset: DatasetInfo = {
          name: fileName,
          path: filePath,
          assetType: assetType as 'crypto' | 'stock' | 'forex',
          exchange: exchange,
          symbol: symbol,
          timeframe: timeframe
        };
        
        return new DatasetTreeItem(
          `dataset-${fileName}`,
          fileName,
          false,
          [],
          'dataset',
          dataset
        );
      });
  }

  getTreeItem(element: DatasetTreeItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.isFolder
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );
    
    treeItem.id = element.id;
    
    // Set icon based on folder or file
    if (element.isFolder) {
      treeItem.iconPath = new vscode.ThemeIcon('folder');
      
      // Set context value for asset folder to show + button
      if (element.assetType) {
        treeItem.contextValue = 'assetFolder';
      }
    } else {
      treeItem.iconPath = new vscode.ThemeIcon('file');
    }
    
    // Set tooltip
    if (element.dataset) {
      treeItem.tooltip = `Exchange: ${element.dataset.exchange}\nSymbol: ${element.dataset.symbol}\nTimeframe: ${element.dataset.timeframe}\nPath: ${element.dataset.path}`;
      
      // Add command to open dataset file
      treeItem.command = {
        command: 'backtestManager.openDataset',
        title: 'Open Dataset File',
        arguments: [element.dataset]
      };
      
      treeItem.contextValue = 'dataset';
    } else {
      treeItem.tooltip = element.label;
    }
    
    return treeItem;
  }

  getChildren(element?: DatasetTreeItem): Thenable<DatasetTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.data);
    }
    
    return Promise.resolve(element.children || []);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateData(): void {
    this.loadDatasets();
  }

  // Method to delete dataset
  async deleteDataset(dataset: DatasetInfo): Promise<void> {
    try {
      const result = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the "${dataset.name}" dataset?`,
        { modal: true },
        'Delete'
      );
      
      if (result === 'Delete') {
        await vscode.workspace.fs.delete(vscode.Uri.file(dataset.path), { recursive: true });
        this.updateData();
        vscode.window.showInformationMessage(`Dataset deleted successfully.`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error deleting dataset: ${error}`);
    }
  }
} 