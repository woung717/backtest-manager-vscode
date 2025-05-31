export interface CustomEngineConfig {
  pythonPath: string;
  datasetPaths?: string[]; 

  strategy: string;
  strategyParams?: Record<string, any>;
  logLevel?: 'debug' | 'info' | 'warning' | 'error';

  env?: Record<string, string>;
}