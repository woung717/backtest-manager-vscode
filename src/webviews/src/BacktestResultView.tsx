import React, { useEffect, useRef, useState } from 'react';
import { Backtest } from '../../types';

// Lightweight Charts type definition
declare const LightweightCharts: any;

interface BacktestResultViewProps {
  backtest?: Backtest;
}

interface EquityData {
  time: number;
  value: number;
}

const BacktestResultView: React.FC<BacktestResultViewProps> = ({ backtest }) => {
  const equityChartRef = useRef<HTMLDivElement>(null);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  // Effect for chart rendering
  useEffect(() => {
    if (!backtest || !equityChartRef.current) return;

    // Equity chart data
    const equityData = Object.values(
      backtest.equity.reduce((acc, e) => {
        const time = new Date(e.datetime).getTime() / 1000;
        acc[time] = {
          time: time,
          value: e.value,
        };
        return acc;
      }, {} as Record<number, EquityData>)
    )
    .sort((a, b) => a.time - b.time) as EquityData[];

    // Calculate Drawdown data
    const drawdownData: EquityData[] = [];
    let peakEquity = -Infinity;
    if (equityData.length > 0) {
      peakEquity = equityData[0].value; // Initialize with the first equity value
    }

    for (const point of equityData) {
      if (point.value > peakEquity) {
        peakEquity = point.value;
      }
      
      const drawdownValue = peakEquity > 0 ? (peakEquity - point.value) / peakEquity : 0;
      drawdownData.push({
        time: point.time,
        value: drawdownValue,
      });
    }

    // Calculate chart size
    const containerWidth = equityChartRef.current.clientWidth;
    const containerHeight = 300; // Fixed height

    // Chart default options
    const chartBaseOptions = {
      layout: {
        // background: { type: LightweightCharts.ColorType.Solid, color: '#ffffff' }, // More explicit way
        background: { color: '#ffffff' },
        textColor: '#333333',
        fontFamily: 'var(--vscode-font-family)',
      },
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      leftPriceScale: { // For Drawdown
        visible: true,
        borderColor: '#e0e0e0',
        autoScale: true,
        invertScale: true,
        scaleMargins: {
          top: 0.05,
          bottom: 0.3,
        },
        // Formatter for labels is set in series.priceFormat
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 1, // Small offset to ensure last data point is not cut off
        leftOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: false,
      },
      handleScale: {
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    let chart: any = null; // Use 'any' due to global LightweightCharts type
    let initialAdjustTimeoutId: NodeJS.Timeout | null = null;
    let resizeAdjustTimeoutId: NodeJS.Timeout | null = null;

    // Initialize equity chart
    chart = LightweightCharts.createChart(equityChartRef.current, {
      ...chartBaseOptions,
      width: containerWidth,
      height: containerHeight,
    });

    const equitySeries = chart.addSeries(LightweightCharts.AreaSeries, {
      lineColor: '#3B82F6',
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
      lastValueVisible: true,
      priceLineVisible: true,
      crosshairMarkerVisible: true,
      baseLineVisible: true,
      baseLineColor: '#aaaaaa',
      baseLineWidth: 1, // LargeDashed (3) or Dotted (1)
      baseLineStyle: 3, // Using 3 for LargeDashed as in original
    });

    // Add Drawdown Series
    const drawdownSeries = chart.addSeries(LightweightCharts.AreaSeries, {
      priceScaleId: 'left', 
      invertFilledArea: true, 
      bottomColor: 'rgba(54, 188, 155, 0.5)',
      topColor: 'rgba(54, 188, 155, 0.0)',
      lineColor: 'rgba(54, 188, 155, 1.0)',
      lineWidth: 1,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => (price * 100).toFixed(1) + '%', // Format as percentage e.g. 10.5%
        minMove: 0.0001, // Smallest change is 0.01%
      },
      lastValueVisible: true,
      priceLineVisible: true,
      crosshairMarkerVisible: true,
      baseLineVisible: true,
      baseLineColor: '#aaaaaa',
      baseLineWidth: 1, // LargeDashed (3) or Dotted (1)
      baseLineStyle: 3, // Using 3 for LargeDashed as in original
    });

    drawdownSeries.setData(drawdownData);
    equitySeries.setData(equityData);
    
    const adjustChartView = () => {
      if (!equityChartRef.current || !chart ) return;
      try {
        chart.timeScale().fitContent();
        chart.applyOptions({
          timeScale: {
            barSpacing: 0.2, // Minimize bar spacing to show more data
          },
        });

        if (equityData.length > 0) {
          const minTime = equityData[0].time;
          const maxTime = equityData[equityData.length - 1].time;
          const timeRange = maxTime - minTime;
          
          // Add small padding to the visible range
          const padding = timeRange > 0 ? timeRange * 0.01 : 1; // Ensure padding is positive
          
          chart.timeScale().setVisibleRange({
            from: minTime - padding,
            to: maxTime + padding,
          });
        }
      } catch (e) {
        console.warn("Chart adjustment error:", e);
        // Fallback if setVisibleRange fails or chart was removed
        if (chart && chart.timeScale && typeof chart.timeScale.fitContent === 'function') {
          try { chart.timeScale().fitContent(); } catch (fitContentError) {
            console.warn("Fallback fitContent error:", fitContentError);
          }
        }
      }
    };

    initialAdjustTimeoutId = setTimeout(adjustChartView, 50);
    
    const handleResize = () => {
      if (equityChartRef.current && chart) {
        chart.applyOptions({
          width: equityChartRef.current.clientWidth,
        });
        if (resizeAdjustTimeoutId) clearTimeout(resizeAdjustTimeoutId);
        resizeAdjustTimeoutId = setTimeout(adjustChartView, 50); // Re-apply view adjustments
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (initialAdjustTimeoutId) clearTimeout(initialAdjustTimeoutId);
      if (resizeAdjustTimeoutId) clearTimeout(resizeAdjustTimeoutId);
      window.removeEventListener('resize', handleResize);
      if (chart) {
        try {
          chart.remove();
        } catch (removeError) {
          console.warn("Error removing chart:", removeError);
        }
      }
    };
  }, [backtest]);

  if (!backtest) {
    return (
      <div className="flex justify-center items-center h-screen text-[var(--vscode-descriptionForeground)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--vscode-button-background)] border-t-transparent"></div>
      </div>
    );
  }

  // Convert trade info to simplified format
  const simplifiedTrades = Object.entries(backtest.trades).map(([id, trade]) => {
    // Instead of calculating the last exit, maintain all exit information
    return {
      id,
      type: trade.enter.side === 'long' ? 'Long' : 'Short',
      entry: trade.enter.price,
      time: trade.enter.datetime,
      size: trade.enter.size,
      exits: trade.exits.map(exit => ({
        exitTime: exit.datetime,
        exitPrice: exit.price,
        exitSize: exit.size,
        holdBars: exit.hold_bars,
        profit: exit.pnlcomm,
        isProfit: exit.pnlcomm > 0,
      })),
      // Total profit information for statistics (sum of all exits)
      totalProfit: trade.exits.reduce((sum, exit) => sum + exit.pnlcomm, 0),
      isOverallProfit: trade.exits.reduce((sum, exit) => sum + exit.pnlcomm, 0) > 0,
    };
  });

  return (
    <div className="bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] font-[var(--vscode-font-family)] p-5">
      <div className="flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Backtest Results</h1>
          <div className="text-sm">
            <p>Date: {backtest.date}</p>
            {backtest.strategy && <p>Strategy: {backtest.strategy}</p>}
            <p>ID: {backtest.id}</p>
          </div>
        </div>

        {/* Basic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Total Return</div>
            <div className="text-lg font-semibold">{(backtest.performance.totalReturn * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Win Rate</div>
            <div className="text-lg font-semibold">{(backtest.performance.winRate * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Max Drawdown</div>
            <div className="text-lg font-semibold">{(backtest.performance.maxDrawdown * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Number of Trades</div>
            <div className="text-lg font-semibold">{backtest.performance.trades}</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Win/Loss Ratio</div>
            <div className="text-lg font-semibold">{backtest.performance.avgWinLossRatio.toFixed(2)}</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <div className="text-xs text-[var(--vscode-descriptionForeground)]">Sharpe Ratio</div>
            <div className="text-lg font-semibold">{backtest.performance.sharpeRatio.toFixed(2)}</div>
          </div>
        </div>

        {/* Advanced Metrics Toggle */}
        <div className="flex items-center">
          <button 
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            className="flex items-center text-[var(--vscode-button-foreground)] hover:text-[var(--vscode-button-hoverBackground)] transition-colors"
          >
            <span className={`transform transition-transform ${showAdvancedMetrics ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="ml-2 text-sm font-semibold">Extra Metrics</span>
          </button>
        </div>

        {showAdvancedMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg group">
              <div className="text-xs text-[var(--vscode-descriptionForeground)]">Sortino Ratio</div>
              <div className="text-lg font-semibold">{backtest.performance.sortinoRatio.toFixed(2)}</div>
            </div>
            <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg group">
              <div className="text-xs text-[var(--vscode-descriptionForeground)]">Calmar Ratio</div>
              <div className="text-lg font-semibold">{backtest.performance.calmarRatio.toFixed(2)}</div>
            </div>
            <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg group">
              <div className="text-xs text-[var(--vscode-descriptionForeground)]">Skewness</div>
              <div className="text-lg font-semibold">{backtest.performance.skewness.toFixed(2)}</div>
            </div>
            <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg group">
              <div className="text-xs text-[var(--vscode-descriptionForeground)]">Kurtosis</div>
              <div className="text-lg font-semibold">{backtest.performance.kurtosis.toFixed(2)}</div>
            </div>
          </div>
        )}
        
        <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] rounded-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--vscode-panel-border)] ">
            <h3 className="text-base font-bold">Equity Curve</h3>
          </div>
          <div className="p-2 ">
            <div 
              id="equityChart" 
              ref={equityChartRef} 
              className="w-full h-[300px] overflow-hidden"
            ></div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Trade History</h2>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[var(--vscode-editor-inactiveSelectionBackground)] border-b-2 border-[var(--vscode-panel-border)]">
                  <tr>
                    <th className="p-2 text-center">ID</th>
                    <th className="p-2 text-left">Direction</th>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-left">Entry Time</th>
                    <th className="p-2 text-left">Trade Price</th>
                    <th className="p-2 text-left">Exit Info</th>
                    <th className="p-2 text-left">Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {simplifiedTrades.map((trade) => (
                    <React.Fragment key={trade.id}>
                      <tr className={`border-b border-[var(--vscode-panel-border)] ${
                        trade.isOverallProfit 
                          ? 'bg-[rgba(46, 160, 67, 0.08)]' 
                          : 'bg-[rgba(218, 54, 51, 0.08)]'
                      }`}>
                        <td className="p-2 font-bold text-center">{trade.id}</td>
                        <td className="p-2">{trade.type === 'Long' ? 'Buy' : 'Sell'}</td>
                        <td className="p-2">{trade.size.toFixed(2)}</td>
                        <td className="p-2">{new Date(trade.time).toLocaleString()}</td>
                        <td className="p-2">{trade.entry.toFixed(2)}</td>
                        <td className="p-2"></td>
                        <td className={`p-2 font-bold ${trade.isOverallProfit 
                          ? 'text-[var(--vscode-testing-iconPassed)]' 
                          : 'text-[var(--vscode-testing-iconFailed)]'}`}>
                          {trade.totalProfit.toFixed(2)}
                        </td>
                      </tr>
                      {/* Sub-row for each Exit */}
                      {trade.exits.map((exit, exitIndex) => (
                        <tr key={`${trade.id}-exit-${exitIndex}`} className="border-b border-[var(--vscode-panel-border)] hover:bg-[var(--vscode-list-hoverBackground)]">
                          <td className="p-2 pl-8" colSpan={4}>
                            <div className="flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-[var(--vscode-editorInfo-foreground)] mr-2"></span>
                              <span className="text-[var(--vscode-descriptionForeground)]">Exit #{exitIndex + 1}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{exit.exitPrice.toFixed(2)}</div>
                            <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                              Size: {exit.exitSize.toFixed(2)}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{new Date(exit.exitTime).toLocaleString()}</div>
                            <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                              Bars held: {exit.holdBars || '-'}
                            </div>
                          </td>
                          <td className={`p-2 ${exit.isProfit 
                            ? 'text-[var(--vscode-testing-iconPassed)]' 
                            : 'text-[var(--vscode-testing-iconFailed)]'}`}>
                            <div className="font-medium">{exit.profit.toFixed(2)}</div>
                            <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                              {((exit.profit / (trade.entry * exit.exitSize)) * 100).toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestResultView;