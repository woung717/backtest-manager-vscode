import React from 'react';
import { createRoot } from 'react-dom/client';
import BacktraderSettingView from './setting-view/BacktraderSettingView';
import VectorBTSettingView from './setting-view/VectorBTSettingView';
import { ProjectInfo, DatasetInfo } from '../../types';
import '../lib/VSCode.css';
import CustomEngineSettingView from './setting-view/CustomEngineSettingView';
const root = document.getElementById('root');

if (root) {
  let currentProject: ProjectInfo | undefined;
  let datasets: DatasetInfo[] = [];
  let lastConfig: any = undefined;
  const reactRoot = createRoot(root);

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'update':
        currentProject = message.data.currentProject;
        datasets = message.data.datasets || [];
        lastConfig = message.data.lastConfig;
        render();
        break;
    }
  });

  function render() {
    reactRoot.render(
      <React.StrictMode>
        {currentProject?.engine === 'vectorbt' ? (
          <VectorBTSettingView
            currentProject={currentProject}
            datasets={datasets}
            lastConfig={lastConfig}
          />
        ) : currentProject?.engine === 'backtrader' ? (
          <BacktraderSettingView
            currentProject={currentProject}
            datasets={datasets}
            lastConfig={lastConfig}
          />
        ) : currentProject?.engine === 'custom' ? (
          <CustomEngineSettingView
            currentProject={currentProject}
            lastConfig={lastConfig}
          />
        ) : (
          <div>
            No project selected or project engine not set.
          </div>
        )}
      </React.StrictMode>
    );
  }

  render();
} 