// src/services/projectService.ts
import { ProjectInfo, Engine, Backtest } from '../types';
import * as path from 'path';
import { templateCodeFactory } from '../userCodeTemplates';
import { Database } from '../database'; 
import * as vscode from 'vscode';

export interface IProjectService {
  getProjects(): Promise<ProjectInfo[]>;
  getProject(projectId: string): Promise<ProjectInfo | null>;
  getProjectByName(projectName: string): Promise<ProjectInfo | null>;
  createProject(projectName: string, engine: Engine, workspaceRootPath: string): Promise<ProjectInfo>;
  updateProject(projectId: string, projectData: Partial<ProjectInfo>): Promise<ProjectInfo | null>;
  deleteProject(projectId: string): Promise<boolean>;
  addBacktestResult(projectId: string, backtestResult: Backtest): Promise<ProjectInfo | null>;
  deleteBacktestResult(projectId: string, backtestResultId: string): Promise<ProjectInfo | null>; 
  updateLastConfig(projectId: string, config: any): Promise<ProjectInfo | null>;
}


export class ProjectService implements IProjectService {
  private readonly entryFileName: string = 'main.py'; 

  constructor(private database: Database, private workspaceRootPath: string) {} // Updated constructor

  async getProjects(): Promise<ProjectInfo[]> {
    return await this.database.getProjects();
  }

  async getProject(projectId: string): Promise<ProjectInfo | null> {
    if (!this.database.isDatabaseLoaded()) {
      return null;
    }

    const project = await this.database.getProject(projectId);
    return project || null; // NeDB findOne can return undefined, ensure null if not found
  }

  async getProjectByName(projectName: string): Promise<ProjectInfo | null> {
    if (!this.database.isDatabaseLoaded()) {
      return null; 
    }

    const project = await this.database.getProjectByName(projectName);
    return project || null; // Ensure null if not found
  }

  async createProject(projectName: string, engine: Engine, workspaceRootPath: string): Promise<ProjectInfo> {
    const projectPath = path.join(workspaceRootPath, projectName); // workspaceRootPath is the project's direct parent from input
    const entryFilePath = path.join(projectPath, this.entryFileName);
    
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(projectPath)); // Ensure the directory is created in VS Code workspace
    const templateCode = templateCodeFactory(engine);
    await vscode.workspace.fs.writeFile(vscode.Uri.file(entryFilePath), Buffer.from(templateCode, 'utf-8')); 

    const newProjectForDb: ProjectInfo = {
      name: projectName,
      path: projectPath,
      entryFile: this.entryFileName,
      engine: engine,
      description: undefined,
      created: new Date(),
      updated: new Date(),
      results: [], // Initialize as empty array
      lastConfig: {} // Initialize as empty object or specific default config structure
    };

    return await this.database.addProject(newProjectForDb);
  }

  async updateProject(projectId: string, projectData: Partial<ProjectInfo>): Promise<ProjectInfo | null> {
    await this.database.updateProject(projectId, projectData);
    return await this.getProject(projectId); // Fetch and return updated project
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      await this.database.deleteProject(projectId);
      return true;
    } catch (error) {
      console.error(`Error deleting project ${projectId}:`, error);
      return false; // Or rethrow if the caller should handle it
    }
  }

  async addBacktestResult(projectId: string, backtestResult: Backtest): Promise<ProjectInfo | null> {
    await this.database.addBacktestResult(projectId, backtestResult);
    return await this.getProject(projectId);
  }

  async deleteBacktestResult(projectId: string, backtestResultId: string): Promise<ProjectInfo | null> {
    await this.database.deleteBacktestResult(projectId, backtestResultId);
    return await this.getProject(projectId);
  }

  async updateLastConfig(projectId: string, config: any): Promise<ProjectInfo | null> {
    await this.database.updateLastConfig(projectId, config);
    return await this.getProject(projectId);
  }

}
