import React from 'react';
import { createRoot } from 'react-dom/client';
import PriceChartView from './PriceChartView';
import { ChartData } from '../../types';
import '../lib/VSCode.css';

const root = document.getElementById('root');

if (root) {
  let chartData: ChartData | undefined;
  const reactRoot = createRoot(root);

  // Message handling
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'update':
        chartData = message.data.chartData;
        render();
        break;
    }
  });

  // Render function
  function render() {
    reactRoot.render(
      <React.StrictMode>
        <PriceChartView chartData={chartData} />
      </React.StrictMode>
    );
  }

  // Initial render
  render();
} 