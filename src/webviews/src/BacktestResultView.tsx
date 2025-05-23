import React, { useEffect, useRef } from 'react';
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
    ) as EquityData[];

    equityData.sort((a, b) => a.time - b.time);

    // Calculate chart size
    const containerWidth = equityChartRef.current.clientWidth;
    const containerHeight = 300; // Fixed height

    // Chart default options
    const defaultChartOptions = {
      layout: {
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
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 0.2, // Minimize bar spacing
        minBarSpacing: 0.03, // Minimize minimum bar spacing
        rightOffset: 0,
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

    // Initialize equity chart
    const equityChart = LightweightCharts.createChart(equityChartRef.current, {
      ...defaultChartOptions,
      width: containerWidth,
      height: containerHeight,
    });

    const equitySeries = equityChart.addSeries(LightweightCharts.AreaSeries, {
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
      baseLineWidth: 1,
      baseLineStyle: 3, // Dotted
    });

    equitySeries.setData(equityData);
    
    // Initially zoom out to show all data
    equityChart.timeScale().fitContent();

    // Optimal view settings
    setTimeout(() => {
      equityChart.timeScale().fitContent();
      
      // Minimize bar spacing to show as much data as possible
      equityChart.applyOptions({
        timeScale: {
          barSpacing: 0.2,
        },
      });
      
      if (equityData.length > 0) {
        const minTime = equityData[0].time;
        const maxTime = equityData[equityData.length - 1].time;
        
        // Add padding for some buffer space on both sides
        const padding = (maxTime - minTime) * 0.01;
        
        try {
          // Set visible range to include entire time range (if possible)
          equityChart.timeScale().setVisibleRange({
            from: minTime - padding,
            to: maxTime + padding,
          });
        } catch (e) {
          // If error occurs, fallback to default method
          equityChart.timeScale().fitContent();
        }
      }
    }, 50);
    
    // Resize chart when window size changes
    const handleResize = () => {
      if (equityChartRef.current) {
        equityChart.applyOptions({
          width: equityChartRef.current.clientWidth,
        });
        
        // Ensure all data is visible after resize
        setTimeout(() => {
          equityChart.timeScale().fitContent();
          
          // Minimize bar spacing to show as much data as possible
          equityChart.applyOptions({
            timeScale: {
              barSpacing: 0.2,
            },
          });
          
          if (equityData.length > 0) {
            const minTime = equityData[0].time;
            const maxTime = equityData[equityData.length - 1].time;
            
            // Add padding for some buffer space on both sides
            const padding = (maxTime - minTime) * 0.01;
            
            try {
              // Set visible range to include entire time range (if possible)
              equityChart.timeScale().setVisibleRange({
                from: minTime - padding,
                to: maxTime + padding,
              });
            } catch (e) {
              // If error occurs, fallback to default method
              equityChart.timeScale().fitContent();
            }
          }
        }, 50);
      }
    };

    window.addEventListener('resize', handleResize);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [backtest]);

  if (!backtest) {
    return (
      <div className="flex justify-center items-center h-screen text-[var(--vscode-descriptionForeground)]">
        No backtest results available.
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Total Return</h3>
            <div className="text-base font-bold">{(backtest.performance.totalReturn * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Sharpe Ratio</h3>
            <div className="text-base font-bold">{backtest.performance.sharpeRatio.toFixed(2)}</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Max Drawdown</h3>
            <div className="text-base font-bold">{(backtest.performance.maxDrawdown * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Win Rate</h3>
            <div className="text-base font-bold">{(backtest.performance.winRate * 100).toFixed(2)}%</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Total Trades</h3>
            <div className="text-base font-bold">{backtest.performance.trades}</div>
          </div>
          <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] p-2 rounded-lg">
            <h3 className="text-xs text-[var(--vscode-descriptionForeground)] mb-1">Winning Trades</h3>
            <div className="text-base font-bold">{simplifiedTrades.filter(t => t.isOverallProfit).length} / {simplifiedTrades.length}</div>
          </div>
        </div>

        <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] rounded-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--vscode-panel-border)] ">
            <h3 className="text-base font-bold">Equity Curve</h3>
          </div>
          <div className="p-2 ">
            <div 
              id="equityChart" 
              ref={equityChartRef} 
              className="w-full h-[300px] overflow-hidden"
              title="Drag to zoom in/out. Double-click to reset view."
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