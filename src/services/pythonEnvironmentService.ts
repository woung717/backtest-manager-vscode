// src/services/pythonEnvironmentService.ts
import * as vscode from 'vscode';
import { spawnSync } from 'child_process';

export interface IPythonEnvironmentService {
  getPythonPath(): Promise<string | undefined>;
  checkLibraryInstalled(pythonPath: string, libraryName: string): Promise<boolean>;
  // installLibrary(pythonPath: string, libraryName: string): Promise<boolean>; // Removed
}

export class PythonEnvironmentService implements IPythonEnvironmentService {
  async getPythonPath(): Promise<string | undefined> {
    console.log('PythonEnvironmentService.getPythonPath called');
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');

    if (!pythonExtension) {
      console.error('Python extension (ms-python.python) not found.');
      // throw new Error('Python extension (ms-python.python) not found. Please install it.');
      return undefined;
    }

    if (!pythonExtension.isActive) {
      try {
        await pythonExtension.activate();
      } catch (error) {
        console.error('Failed to activate Python extension:', error);
        // throw new Error('Failed to activate Python extension.');
        return undefined;
      }
    }
    
    try {
      const executionDetails = pythonExtension.exports.settings.getExecutionDetails();
      if (executionDetails && executionDetails.execCommand && executionDetails.execCommand.length > 0) {
        const pythonPath = executionDetails.execCommand[0];
        console.log(`Python path found: ${pythonPath}`);
        return pythonPath;
      } else {
        console.error('Python executable path not found in extension settings.');
        // throw new Error('Python executable path not found. Please configure the Python interpreter in VSCode.');
        return undefined;
      }
    } catch (error) {
        console.error('Error getting Python execution details:', error);
        // throw new Error('Could not retrieve Python execution details from the Python extension.');
        return undefined;
    }
  }

  async checkLibraryInstalled(pythonPath: string, libraryName: string): Promise<boolean> {
    console.log(`PythonEnvironmentService.checkLibraryInstalled called for library: ${libraryName} using python: ${pythonPath}`);
    if (!pythonPath) {
        console.error("Python path is undefined. Cannot check library.");
        return false;
    }
    try {
      const result = spawnSync(pythonPath, ['-c', `import ${libraryName}`], { encoding: 'utf-8' });
      if (result.status === 0) {
        console.log(`Library ${libraryName} is installed.`);
        return true;
      } else {
        console.log(`Library ${libraryName} is not installed. Stderr: ${result.stderr}`);
        return false;
      }
    } catch (error) {
      console.error(`Error checking if library ${libraryName} is installed:`, error);
      return false;
    }
  }

  // Removed installLibrary method
  // async installLibrary(pythonPath: string, libraryName: string): Promise<boolean> {
  //   console.log(`PythonEnvironmentService.installLibrary called for library: ${libraryName} using python: ${pythonPath}`);
  //   if (!pythonPath) {
  //       console.error("Python path is undefined. Cannot install library.");
  //       return false;
  //   }
  //   // This is a placeholder. Actual implementation would involve running pip install.
  //   // For example: spawnSync(pythonPath, ['-m', 'pip', 'install', libraryName]);
  //   // Ensure to handle errors and output.
  //   console.warn(`Simulating installation for ${libraryName}. In a real scenario, this would run pip install.`);
  //   // For now, just return true to simulate success for testing purposes.
  //   return Promise.resolve(true); 
  // }
}
