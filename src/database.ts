/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from 'path';
import * as zlib from 'zlib';
import vscode from 'vscode';
import { Backtest } from './types';
import { ProjectInfo } from './types';

export class Database {
  private Datastore = require('@seald-io/nedb');
  private static instance: Database;
  private db: any;
  private dbPath = '';
  private isLoaded = false;
  private readonly CONFIG_FILE_NAME: string = '.backtest-man';

  private constructor() {}

  public static getInstance(workspacePath: string): Database {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.initialize(workspacePath);
    } else if (!Database.instance.isLoaded) {
      Database.instance.initialize(workspacePath);
    }
    return Database.instance;
  }

  private unzipIfNeeded(line: string): string | undefined {
    try {
      const buffer = Buffer.from(line, 'base64');
      if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        return zlib.gunzipSync(buffer).toString('utf-8');
      }
      return line;
    } catch (error) {
      vscode.window.showErrorMessage(`Error unzipping file: ${error}`);
      throw new Error(`Error unzipping file: ${error}`);
    }
  }

  private zip(line: string): string {
    try {
      return zlib.gzipSync(Buffer.from(line, 'utf-8')).toString('base64');
    } catch (error) {
      vscode.window.showErrorMessage(`Error unzipping file: ${error}`);
      throw new Error(`Error zipping file: ${error}`);
    }
  }

  private initialize(workspacePath: string) {
    this.dbPath = path.join(workspacePath, this.CONFIG_FILE_NAME);
    this.db = new this.Datastore({
      filename: this.dbPath,
      beforeDeserialization: (line: string) => this.unzipIfNeeded(line),
      afterSerialization: (line: string) => this.zip(line)
    });

    try {
      vscode.workspace.fs.stat(vscode.Uri.file(this.dbPath));
      this.enableStorage();
      this.isLoaded = true;
    } catch {
      this.isLoaded = false;
    }
  }

  private enableStorage(): void {
    this.db.loadDatabase();
    this.db.persistence.compactDatafile();
    this.db.persistence.setAutocompactionInterval(1000 * 60 * 10);
  }

  public isDatabaseLoaded(): boolean {
    return this.isLoaded;
  }

  public getProjects(): (ProjectInfo & { results: Backtest[] })[] {
    if (!this.isLoaded) {
      return [];
    }
    return this.db.find({});
  }

  public getProject(projectId: string): (ProjectInfo & { results: Backtest[] }) | undefined {
    return this.db.findOne({ _id: projectId });
  }

  public getProjectByName(projectName: string): (ProjectInfo & { results: Backtest[] }) | undefined {
    return this.db.findOne({ name: projectName });
  }

  public async addProject(projectData: ProjectInfo): Promise<ProjectInfo> {
    this.enableStorage();
    const projectToInsert = {
      ...projectData,
      results: projectData.results || [],
      lastConfig: projectData.lastConfig || {},
      created: projectData.created || new Date(),
      updated: projectData.updated || new Date(),
    };

    return this.db.insertAsync(projectToInsert);
  }

  public updateProject(projectId: string, updates: Partial<ProjectInfo>): void {
    this.db.update({ _id: projectId }, { $set: updates }, {});
  }

  public updateLastConfig(projectId: string, config: any): void {
    this.db.update({ _id: projectId }, { $set: { lastConfig: config } }, {});
  }

  public deleteProject(projectId: string): void {
    const numRemoved = this.db.remove({ _id: projectId }, {});
    if (numRemoved === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  public getBacktestResults(projectId: string): Backtest[] {
    const project = this.getProject(projectId);
    return project?.results || [];
  }

  public addBacktestResult(projectId: string, result: Backtest): void {
    const numUpdated = this.db.update(
      { _id: projectId },
      { $push: { results: result } },
      {}
    );
    if (numUpdated === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  public deleteBacktestResult(projectId: string, resultId: string): void {
    const numUpdated = this.db.update(
      { _id: projectId },
      { $pull: { results: { id: resultId } } },
      {}
    );
    if (numUpdated === 0) {
      throw new Error(`Project not found or backtest result not found: ${projectId}, ${resultId}`);
    }
  }

  public saveDatabase(): void {
    this.db.persistence.compactDatafile();
  }
}
