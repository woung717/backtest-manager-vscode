import * as vscode from 'vscode';
import * as path from 'path';
import { DatasetInfo } from './types';
import { IDatasetService } from '../services/datasetService'; // Added

export class DatasetTreeItem {
  id: string;
  label: string;
  children?: DatasetTreeItem[];
  contextValue?: string;
  datasetInfo?: DatasetInfo; // Changed from 'dataset' to 'datasetInfo' for clarity
  isFolder: boolean;
  assetType?: 'crypto' | 'stock' | 'forex';

  constructor(
    id: string, 
    label: string, 
    isFolder: boolean = false,
    children?: DatasetTreeItem[], 
    contextValue?: string, 
    datasetInfo?: DatasetInfo,
    assetType?: 'crypto' | 'stock' | 'forex'
  ) {
    this.id = id;
    this.label = label;
    this.children = children;
    this.contextValue = contextValue;
    this.datasetInfo = datasetInfo;
    this.isFolder = isFolder;
    this.assetType = assetType;
  }
}

export class DatasetTreeProvider implements vscode.TreeDataProvider<DatasetTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DatasetTreeItem | undefined | null | void> = new vscode.EventEmitter<DatasetTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DatasetTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private datasetRoot: string; // Set in constructor
  private data: DatasetTreeItem[] = [
    new DatasetTreeItem('loading', 'Loading Datasets...', true) // isFolder true for loading item
  ];
  private readonly ASSET_TYPES: ('crypto' | 'stock' | 'forex')[] = ['crypto', 'stock', 'forex'];


  constructor(
    private datasetService: IDatasetService, // Injected service
    private workspaceRoot: string
  ) {
    if (!workspaceRoot) {
        vscode.window.showErrorMessage("Workspace root is not defined for DatasetTreeProvider.");
        this.datasetRoot = ''; // Or handle error appropriately
    } else {
        this.datasetRoot = path.join(this.workspaceRoot, 'dataset'); // datasetRoot is <workspace>/dataset
    }
    this.loadDatasets();
  }

  // ensureDatasetFolders and getDatasetFilesFromFolder are removed, logic moved to DatasetService.loadDatasetsInWorkspace

  private async loadDatasets(): Promise<void> {
    if (!this.datasetRoot) {
        this.data = [new DatasetTreeItem('error', 'Error: Workspace root not set.', true)];
        this.refresh();
        return;
    }
    try {
      // DatasetService.loadDatasetsInWorkspace will ensure folders and get all DatasetInfo items
      const allDatasetInfos = await this.datasetService.loadDatasetsInWorkspace(this.datasetRoot);

      // Group DatasetInfo items by assetType for the tree structure
      const datasetsByAssetType: Record<string, DatasetInfo[]> = {};
      for (const assetType of this.ASSET_TYPES) {
        datasetsByAssetType[assetType] = [];
      }

      allDatasetInfos.forEach(dsInfo => {
        if (datasetsByAssetType[dsInfo.assetType]) {
          datasetsByAssetType[dsInfo.assetType].push(dsInfo);
        } else {
          console.warn(`Dataset ${dsInfo.name} has unknown assetType: ${dsInfo.assetType}`);
        }
      });

      this.data = this.ASSET_TYPES.map(assetType => {
        const childrenItems = (datasetsByAssetType[assetType] || []).map(dsInfo => 
          new DatasetTreeItem(
            dsInfo.path, // Use path as a unique ID for dataset files
            dsInfo.name,
            false, // isFolder = false
            [],
            'dataset',
            dsInfo,
            dsInfo.assetType
          )
        );
        
        return new DatasetTreeItem(
          `folder-${assetType}`,
          assetType.charAt(0).toUpperCase() + assetType.slice(1), // Capitalize asset type for display
          true, // isFolder = true
          childrenItems,
          'assetFolder', // Context value for the asset type folder
          undefined,
          assetType
        );
      });

      this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(`Error loading datasets: ${error instanceof Error ? error.message : String(error)}`);
      this.data = [new DatasetTreeItem('error', 'Error loading datasets.', true)];
      this.refresh();
    }
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
    if (element.datasetInfo) { // Changed from element.dataset
      treeItem.tooltip = `Exchange: ${element.datasetInfo.exchange}\nSymbol: ${element.datasetInfo.symbol}\nTimeframe: ${element.datasetInfo.timeframe}\nPath: ${element.datasetInfo.path}`;
      
      // Add command to open dataset file
      treeItem.command = {
        command: 'backtestManager.openDataset', // Make sure this command exists
        title: 'Open Dataset File',
        arguments: [element.datasetInfo] // Pass datasetInfo
      };
      
      treeItem.contextValue = 'dataset'; // Context value for individual dataset files
    } else if (element.isFolder) {
      treeItem.tooltip = `Folder for ${element.label} datasets`;
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
  async deleteDataset(item: DatasetTreeItem): Promise<void> { // Takes DatasetTreeItem
    if (!item.datasetInfo || !item.datasetInfo.path) {
        vscode.window.showErrorMessage('Invalid dataset item for deletion.');
        return;
    }
    const datasetPath = item.datasetInfo.path;
    const datasetName = item.datasetInfo.name;

    try {
      const result = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the "${datasetName}" dataset? This action is irreversible.`,
        { modal: true },
        'Delete'
      );
      
      if (result === 'Delete') {
        const success = await this.datasetService.deleteDataset(datasetPath);
        if (success) {
          this.updateData(); // Refresh the tree view
          vscode.window.showInformationMessage(`Dataset "${datasetName}" deleted successfully.`);
        } else {
          vscode.window.showErrorMessage(`Failed to delete dataset "${datasetName}".`);
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error deleting dataset: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}