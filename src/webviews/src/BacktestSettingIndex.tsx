import React from 'react';
import { createRoot } from 'react-dom/client';
import BacktestSettingView from './BacktestSettingView';
import { ProjectInfo, DatasetInfo } from '../../types';
import '../lib/VSCode.css';
const root = document.getElementById('root');

if (root) {
    let currentProject: ProjectInfo | undefined;
    let datasets: DatasetInfo[] = [];
    let lastConfig: any = undefined;
    const reactRoot = createRoot(root);

    // Message handling
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

    // Render function
    function render() {
        reactRoot.render(
            <React.StrictMode>
                <BacktestSettingView 
                    currentProject={currentProject} 
                    datasets={datasets}
                    lastConfig={lastConfig}
                />
            </React.StrictMode>
        );
    }

    // Initial render
    render();
} 