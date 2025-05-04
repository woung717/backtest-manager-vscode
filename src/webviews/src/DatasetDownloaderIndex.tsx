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

    // 초기 렌더링 후 거래소 목록 요청
    function requestExchangeList() {
        VSCodeAPI.postMessage({
            type: 'getAvailableExchanges'
        });
    }

    // Render function
    function render() {
        reactRoot.render(
            <React.StrictMode>
                <DatasetDownloaderView assetType={assetType} />
            </React.StrictMode>
        );

        // 약간의 지연 후 거래소 목록 요청 (React 렌더링 완료 후)
        setTimeout(requestExchangeList, 100);
    }

    // Initial render
    render();
} 