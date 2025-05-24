// src/services/projectService.ts
import { ProjectInfo, BacktestResult, Config, Engine, Backtest } from '../types'; // Assuming these types exist in ../types
import * as path from 'path'; // For createProject
import { templateCodeFactory } from '../userCodeTemplates'; // For createProject

// Ensure ProjectInfo can hold Backtest results for the tree view
// The existing ProjectInfo in types.ts already has 'results?: Backtest[]'

export interface IProjectService {
  getProjects(): Promise<ProjectInfo[]>; // Should return ProjectInfo with results populated
  getProject(projectId: string): Promise<ProjectInfo | null>;
  getProjectByName(projectName: string): Promise<ProjectInfo | null>;
  createProject(projectName: string, engine: Engine, workspaceRootPath: string): Promise<ProjectInfo>;
  updateProject(projectId: string, projectData: Partial<ProjectInfo>): Promise<ProjectInfo | null>;
  deleteProject(projectId: string): Promise<boolean>;
  addBacktestResult(projectId: string, backtestResult: BacktestResult): Promise<ProjectInfo | null>;
  deleteBacktestResult(projectId: string, backtestResultId: string): Promise<ProjectInfo | null>; 
  updateLastConfig(projectId: string, config: Config): Promise<ProjectInfo | null>;
  getProjectStrategyClass(project: ProjectInfo): Promise<string | undefined>; // Added
}

// Need fs for getProjectStrategyClass
import * as fs from 'fs';

export class ProjectService implements IProjectService {
  private readonly entryFileName: string = 'main.py'; 

  async getProjects(): Promise<ProjectInfo[]> {
    console.log('ProjectService.getProjects called - expected to return projects with their results');
    // Simulate fetching projects with their backtest results
    // In a real implementation, this would fetch from a database and join/embed results.
    const sampleProject: ProjectInfo = {
        _id: 'sample1',
        name: 'Sample Project with Results',
        path: '/path/to/sample1',
        entryFile: 'main.py',
        engine: 'backtrader',
        results: [
            { id: 'res1', date: new Date().toISOString(), strategy: 'SampleStrat', performance: {} as any, equity: [], trades: {} } as Backtest
        ],
        lastConfig: {} as Config
    };
    return Promise.resolve([sampleProject]);
  }

  async getProject(projectId: string): Promise<ProjectInfo | null> {
    console.log(`ProjectService.getProject called with projectId: ${projectId}`);
    // Simulate fetching a single project, potentially with results
    return Promise.resolve(null); 
  }

  async getProjectByName(projectName: string): Promise<ProjectInfo | null> {
    console.log(`ProjectService.getProjectByName called with projectName: ${projectName}`);
    return Promise.resolve(null); 
  }

  async createProject(projectName: string, engine: Engine, workspaceRootPath: string): Promise<ProjectInfo> {
    console.log(`ProjectService.createProject called with projectName: ${projectName}, engine: ${engine}, root: ${workspaceRootPath}`);
    const projectPath = path.join(workspaceRootPath, projectName);
    const entryFilePath = path.join(projectPath, this.entryFileName);
    const templateCode = templateCodeFactory(engine);

    console.log(`Simulating: Creating directory at ${projectPath}`);
    // In real implementation: await fs.promises.mkdir(projectPath, { recursive: true });
    
    console.log(`Simulating: Writing template file to ${entryFilePath}`);
    // In real implementation: await fs.promises.writeFile(entryFilePath, templateCode);

    const newProject: ProjectInfo = {
      _id: Date.now().toString(), // dummy id from DB
      name: projectName,
      path: projectPath,
      entryFile: this.entryFileName,
      engine: engine,
      results: [],
      lastConfig: {} as Config,
      created: new Date(),
      updated: new Date()
    };
    
    console.log(`Simulating: Saving project ${projectName} to database.`);
    // In real implementation: Database call to save newProject
    
    return Promise.resolve(newProject);
  }

  async updateProject(projectId: string, projectData: Partial<ProjectInfo>): Promise<ProjectInfo | null> {
    console.log(`ProjectService.updateProject called with projectId: ${projectId}, data:`, projectData);
    // Simulate updating a project
    // In real implementation: find project by ID, update, save, return updated.
    return Promise.resolve(null); 
  }

  async deleteProject(projectId: string): Promise<boolean> {
    console.log(`ProjectService.deleteProject called with projectId: ${projectId}`);
    // Simulate deleting a project
    // In real implementation: DB call to delete, and potentially delete files from fs.
    return Promise.resolve(true);
  }

  async addBacktestResult(projectId: string, backtestResult: BacktestResult): Promise<ProjectInfo | null> {
    console.log(`ProjectService.addBacktestResult called for projectId: ${projectId} with result:`, backtestResult);
    // Simulate adding a backtest result
    return Promise.resolve(null); 
  }

  async deleteBacktestResult(projectId: string, backtestResultId: string): Promise<ProjectInfo | null> {
    console.log(`ProjectService.deleteBacktestResult called for projectId: ${projectId} with backtestResultId: ${backtestResultId}`);
    // Simulate deleting a backtest result, then return the updated project or null
    // In real implementation: find project, remove backtest result from its 'results' array, save project.
    return Promise.resolve(null); 
  }

  async updateLastConfig(projectId: string, config: Config): Promise<ProjectInfo | null> {
    console.log(`ProjectService.updateLastConfig called for projectId: ${projectId} with config:`, config);
    // Simulate updating the last config
    return Promise.resolve(null); // Replace with actual logic
  }

  public async getProjectStrategyClass(project: ProjectInfo): Promise<string | undefined> {
    const entryFilePath = path.join(project.path, project.entryFile);
    try {
        // Check if file exists first (optional, readFile will throw anyway)
        await fs.promises.stat(entryFilePath); 
        const buffer = await fs.promises.readFile(entryFilePath);
        const strategyCode = Buffer.from(buffer).toString('utf8');
        // This pattern is specific to Backtrader strategies.
        // For VectorBT, strategy identification might be different (e.g., function names, or no specific class needed).
        // This might need to be more flexible or engine-aware if supporting multiple patterns.
        const backtraderStrategyClassPattern = /class\s+(\w+)\s*\((?:bt\.|backtrader\.)?Strategy\):/gm; 
        
        let match;
        let lastMatch: string | undefined;
        // Iterate over all matches in case there are multiple strategy classes defined (e.g. base and derived)
        // Typically, users might have one main strategy class per file.
        while ((match = backtraderStrategyClassPattern.exec(strategyCode)) !== null) {
            lastMatch = match[1];
        }
        
        if (lastMatch) {
            console.log(`Strategy class found: ${lastMatch} in ${entryFilePath}`);
            return lastMatch;
        } else {
            console.log(`No Backtrader strategy class found in ${entryFilePath} with pattern ${backtraderStrategyClassPattern}`);
            // Optionally, try other patterns for VectorBT or other engines if project.engine is checked
            return undefined;
        }
    } catch (error) {
        console.error(`Error reading strategy file or finding class: ${entryFilePath}`, error);
        // Decide if to throw or return undefined. For this usage, undefined is probably fine.
        return undefined; 
    }
  }
}
