import * as vscode from 'vscode';

export class VSCodeOutputLogger {
  private static instances: Map<string, VSCodeOutputLogger> = new Map();
  private outputChannel: vscode.OutputChannel;

  private constructor(name: string) {
    this.outputChannel = vscode.window.createOutputChannel(name);
  }

  public static getInstance(name: string): VSCodeOutputLogger {
    if (!this.instances.has(name)) {
      this.instances.set(name, new VSCodeOutputLogger(name));
    }
    return this.instances.get(name)!;
  }

  public log(message: string): void {
    this.outputChannel.appendLine(message);
  }

  public revealPanel(): void {
    this.outputChannel.show();
  }
} 