import * as path from 'path';
import * as vscode from 'vscode';
import { Backtest } from './types';
import { ProjectInfo } from './types';

export class Database {
    private static instance: Database;
    private Datastore = require('@seald-io/nedb');
    private zlib = require('zlib');
    private createGzip = require('node:zlib').createGzip;
    private readonly CONFIG_FILE_NAME: string = '.backtest-man';
    private db: any;
    private initialized: boolean = false;

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

    private initialize(workspacePath: string): void {
        if (this.initialized) {
            return;
        }

        try {
            const dbPath = path.join(workspacePath, this.CONFIG_FILE_NAME);
            this.db = new this.Datastore({ filename: dbPath, autoload: true });
            this.db.setAutocompactionInterval(1000 * 60 * 10);
            this.initialized = true;
        } catch (error) {
            throw new Error(`Error initializing database: ${error}`);
        }
    }

    private async compressPersistent() {
        this.zlib.gzip(this.db, (err: any, buffer: any) => {
            if (err) {
                throw new Error(`Error during compression: ${err}`);
            }
            this.db = buffer;
            this.zlib.createGzip();
        });
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
}
