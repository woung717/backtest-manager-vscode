import * as path from 'path';
import * as vscode from 'vscode';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { Backtest } from './types';
import { ProjectInfo } from './types';

export class Database {
    private static instance: Database;
    private Datastore = require('@seald-io/nedb');
    private readonly CONFIG_FILE_NAME: string = '.backtest-man';
    private db: any;
    private initialized: boolean = false;
    private dbPath: string = '';
    private readonly gzip = promisify(zlib.gzip);
    private readonly gunzip = promisify(zlib.gunzip);

    private constructor() {}

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
            
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('Workspace not found.');
            }
            
            try {
                Database.instance.initialize(workspaceFolders[0].uri.fsPath);
            } catch (error) {
                throw error;
            }
        }

        if (!Database.instance.initialized) {
            throw new Error('Database is not initialized.');
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

        try {
            this.dbPath = path.join(workspacePath, this.CONFIG_FILE_NAME);
            
            this.db = new this.Datastore({ 
                filename: this.dbPath, 
                autoload: true,
                beforeDeserialization: async (line: string) => {
                    return await this.unzipIfNeeded(line);
                },
                afterSerialization: async (line: string) => {
                    return await this.zip(line);
                }
            });
            
            this.db.setAutocompactionInterval(1000 * 60 * 10);
            
            this.initialized = true;
        } catch (error) {
            throw new Error(`Error initializing database: ${error}`);
        }
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

    public async addProject(project: ProjectInfo): Promise<ProjectInfo> {
        const newProject = {
            ...project,
            results: []
        };
        const insertedProject = await this.db.insertAsync(newProject);
        return insertedProject;
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
