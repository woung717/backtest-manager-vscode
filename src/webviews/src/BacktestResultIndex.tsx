import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import BacktestResultView from './BacktestResultView';
import { Backtest } from '../../types';
import '../lib/VSCode.css';

const root = document.getElementById('root');

if (root) {
  let backtestResult: Backtest | undefined;
  const reactRoot = createRoot(root);

  // Message handling
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'update':
        backtestResult = message.data.backtest;
        console.log(backtestResult);
        render();
        break;
    }
  });

  // Render function
  function render() {
    reactRoot.render(
      <React.StrictMode>
        <BacktestResultView backtest={backtestResult} />
      </React.StrictMode>
    );
  }

  // Initial render
  render();
} 