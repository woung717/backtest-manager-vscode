import React, { useState } from 'react';
import { ProjectInfo } from '../../../types';
import VSCodeAPI from '../../lib/VSCodeAPI';
import EnvironmentVariables from './components/EnvironmentVariables';


type CustomEngineSettingViewProps = {
  currentProject?: ProjectInfo;
  lastConfig?: any;
};

const CustomEngineSettingView: React.FC<CustomEngineSettingViewProps> = ({ currentProject, lastConfig }) => {
  // Environment variable state management
  const [envVariables, setEnvVariables] = useState<{
    id: string;
    key: string;
    value: string;
  }[]>([]);

  // Add new environment variable
  const addEnvVariable = () => {
    const newId = `env_${Date.now()}`;
    setEnvVariables([...envVariables, { id: newId, key: '', value: '' }]);
  };
  
  // Remove environment variable
  const removeEnvVariable = (id: string) => {
    setEnvVariables(envVariables.filter(env => env.id !== id));
  };
  
  // Change environment variable value
  const updateEnvVariable = (id: string, field: 'key' | 'value', newValue: string) => {
    setEnvVariables(
      envVariables.map(env => 
        env.id === id ? { ...env, [field]: newValue } : env
      )
    );
  };

  // Initialize settings based on last configuration
  React.useEffect(() => {
    if (lastConfig) {
      // Environment variables
      if (lastConfig.env) {
        const envVars: { id: string; key: string; value: string }[] = [];
        Object.entries(lastConfig.env).forEach(([key, value]) => {
          envVars.push({
            id: `env_${Date.now()}_${key}`,
            key,
            value: value as string
          });
        });
        if (envVars.length > 0) {
          setEnvVariables(envVars);
        }
      }
    }
  }, [lastConfig]);

  const handleRunBacktest = () => {
    // Create environment variable object
    const envObject: Record<string, string> = {};
    envVariables.forEach(env => {
      if (env.key.trim()) {
        envObject[env.key.trim()] = env.value;
      }
    });

    const config = {
      env: envObject
    };

    VSCodeAPI.postMessage({
      type: 'runBacktest',
      config,
    });
  };

  return (
    <div className="flex flex-col space-y-4 mt-2 mb-2">
      <div id="projectInfo" className="text-sm text-[var(--vscode-descriptionForeground)] mb-2 whitespace-pre-line] border border-[var(--vscode-input-border)] p-2 rounded">
        {currentProject ? (
          <p>
            Project: {currentProject.name} <br />
            Directory: {currentProject.path} <br />
            Backtest Engine: {currentProject.engine}
          </p>
        ) : (
          'Select a project'
        )}
      </div>

      <EnvironmentVariables
        envVariables={envVariables}
        addEnvVariable={addEnvVariable}
        removeEnvVariable={removeEnvVariable}
        updateEnvVariable={updateEnvVariable}
      />

      {/* Run Button */}
      <div>
        {/* <button
          onClick={handleRunBacktest}
          className="w-full text-sm text-[var(--vscode-button-foreground)] bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-3 font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:from-blue-500 hover:to-purple-500 active:scale-[0.98] active:shadow-md"
        ></button> */}
        <button
          onClick={handleRunBacktest}
          className="w-full text-sm text-[var(--vscode-button-foreground)] bg-[var(--vscode-button-background)] rounded px-4 py-2 hover:bg-[var(--vscode-button-hoverBackground)]"
        >
          Run Backtest
        </button>
      </div>
    </div>
  );
};

export default CustomEngineSettingView;