import React from 'react';

type EnvironmentVariablesProps = {
  envVariables: Array<{
    id: string;
    key: string;
    value: string;
  }>;
  addEnvVariable: () => void;
  removeEnvVariable: (id: string) => void;
  updateEnvVariable: (id: string, field: 'key' | 'value', newValue: string) => void;
};

const EnvironmentVariables: React.FC<EnvironmentVariablesProps> = ({
  envVariables,
  addEnvVariable,
  removeEnvVariable,
  updateEnvVariable,
}) => {
  return (
    <div className="space-y-1 pb-4 border-b border-[var(--vscode-input-border)]">
      <div className="mb-3 flex justify-between items-center">
        <label className="text-sm font-bold text-[var(--vscode-input-foreground)]">
          Environment Variables
        </label>
        <button
          onClick={addEnvVariable}
          className="bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] py-1 px-2 text-xs rounded hover:bg-[var(--vscode-button-hoverBackground)]"
        >
          +
        </button>
      </div>
      <div className="space-y-2">
        {envVariables.length === 0 && (
          <div className="text-sm text-[var(--vscode-descriptionForeground)] italic">
            No environment variables set. Click the '+' button to add a variable.
          </div>
        )}
        {envVariables.map((env) => (
          <div key={env.id} className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Variable Name"
                value={env.key}
                onChange={(e) => updateEnvVariable(env.id, 'key', e.target.value)}
                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Value"
                value={env.value}
                onChange={(e) => updateEnvVariable(env.id, 'value', e.target.value)}
                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] p-1 text-sm rounded"
              />
            </div>
            <button
              onClick={() => removeEnvVariable(env.id)}
              className="bg-[var(--vscode-editorError-foreground)] text-[var(--vscode-button-foreground)] py-1 px-2 text-xs rounded hover:opacity-80"
              title="Delete"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentVariables;
