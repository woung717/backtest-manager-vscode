/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from 'path';
import * as zlib from 'zlib';
import vscode from 'vscode';
import { promisify } from 'util';
import { Backtest } from './types';
import { ProjectInfo } from './types';

export class Database {
  private Datastore = require('@seald-io/nedb');
  private static instance: Database;
  private db: any;
  private dbPath = '';
  private initialized = false;
  private isLoaded = false;
  private readonly CONFIG_FILE_NAME: string = '.backtest-man';
  private readonly gzip = promisify(zlib.gzip);
  private readonly gunzip = promisify(zlib.gunzip);

  private constructor() {}

  public static getInstance(workspacePath: string): Database {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.initialize(workspacePath);
    } else if (!Database.instance.initialized) {
      Database.instance.initialize(workspacePath);
    }
    
    if (!Database.instance.initialized) {
      throw new Error('Database could not be initialized.');
    }

    return Database.instance;
  }

  private async unzipIfNeeded(line: string): Promise<string> {
    try {
      const buffer = Buffer.from(line, 'base64');
      if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
        const decompressed = await this.gunzip(buffer);
        return decompressed.toString('utf-8');
      }
      return line;
    } catch (error) {
      throw new Error(`Error unzipping file: ${error}`);
    }
  }

  private async zip(line: string): Promise<string> {
    try {
      const compressed = await this.gzip(Buffer.from(line, 'utf-8'));
      return compressed.toString('base64');
    } catch (error) {
      throw new Error(`Error zipping file: ${error}`);
    }
  }

  private async initialize(workspacePath: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!workspacePath) {
        this.initialized = false;
        throw new Error('Workspace path is required to initialize the database.');
    }

    this.dbPath = path.join(workspacePath, this.CONFIG_FILE_NAME);

    try {
      this.db = new this.Datastore({ 
        filename: this.dbPath,
        beforeDeserialization: async (line: string) => {
          return await this.unzipIfNeeded(line);
        },
        afterSerialization: async (line: string) => {
          return await this.zip(line);
        }
      });
      
      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      throw new Error(`Error initializing database at ${this.dbPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(this.dbPath));
      this.enableStorage();
    } catch {
      console.log(`Database file not found at ${this.dbPath}.`);
    }
  }

  private async enableStorage(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.db.loadDatabaseAsync();
    await this.db.compactDatafileAsync();

    this.db.persistence.setAutocompactionInterval(1000 * 60 * 10);

    this.isLoaded = true;
  }

  public isDatabaseLoaded(): boolean {
    return this.isLoaded;
  }

  public async getProjects(): Promise<(ProjectInfo & { results: Backtest[] })[]> {
    return await this.db.findAsync({});
  }

  public async getProject(projectId: string): Promise<(ProjectInfo & { results: Backtest[] }) | undefined> {
    return await this.db.findOneAsync({ _id: projectId });
  }

  public async getProjectByName(projectName: string): Promise<(ProjectInfo & { results: Backtest[] }) | undefined> {
    return await this.db.findOneAsync({ name: projectName });
  }

  public async addProject(projectData: ProjectInfo): Promise<ProjectInfo> {
    await this.enableStorage();

    const projectToInsert = {
      ...projectData, 
      results: projectData.results || [], // Initialize if not present
      lastConfig: projectData.lastConfig || {}, // Initialize if not present
      created: projectData.created || new Date(), // Set if not present
      updated: projectData.updated || new Date(), // Set if not present
    };
    const insertedProject = await this.db.insertAsync(projectToInsert);

    return insertedProject as ProjectInfo; // Cast because NeDB types might be generic
  }

  public async updateProject(projectId: string, updates: Partial<ProjectInfo>): Promise<void> {
    await this.db.updateAsync({ _id: projectId }, { $set: updates }, {});
  }

  public async updateLastConfig(projectId: string, config: any): Promise<void> {
    await this.db.updateAsync({ _id: projectId }, { $set: { lastConfig: config } }, {});
  }

  public async deleteProject(projectId: string): Promise<void> {
    const numRemoved = await this.db.removeAsync({ _id: projectId }, {});
    if (numRemoved === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  public async getBacktestResults(projectId: string): Promise<Backtest[]> {
    const project = await this.getProject(projectId);
    return project?.results || [];
  }

  public async addBacktestResult(projectId: string, result: Backtest): Promise<void> {
    const numUpdated = await this.db.updateAsync(
      { _id: projectId },
      { $push: { results: result } },
      {}
    );
    if (numUpdated === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }
  }

  public async deleteBacktestResult(projectId: string, resultId: string): Promise<void> {
    const numUpdated = await this.db.updateAsync(
      { _id: projectId },
      { $pull: { results: { id: resultId } } },
      {}
    );
    if (numUpdated === 0) {
      throw new Error(`Project not found or backtest result not found: ${projectId}, ${resultId}`);
    }
  }

  public async saveDatabase(): Promise<void> {
    await this.db.persistence.compactDatafileAsync();
  }
}
