import React from 'react';
import { createRoot } from 'react-dom/client';
import DatasetDownloaderView from './DatasetDownloaderView';
import '../lib/VSCode.css';
import VSCodeAPI from '../lib/VSCodeAPI';

const root = document.getElementById('root');

if (root) {
  let assetType: 'crypto' | 'stock' | 'forex' = 'crypto';
  const reactRoot = createRoot(root);

  // Message handling
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'update':
        assetType = message.data.assetType || 'crypto';
        render();
        break;
    }
  });

  // Request exchange list after initial render
  function requestExchangeList() {
    VSCodeAPI.postMessage({
      type: 'getAvailableExchanges',
      assetType: assetType
    });
  }

  // Render function
  function render() {
    reactRoot.render(
      <React.StrictMode>
        <DatasetDownloaderView assetType={assetType} />
      </React.StrictMode>
    );

    // Request exchange list after a short delay (after React rendering)
    setTimeout(requestExchangeList, 100);
  }

  // Initial render
  render();
} 