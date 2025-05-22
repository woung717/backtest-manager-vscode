import React, { useEffect, useRef } from 'react';
import { ChartData } from '../../types';

// Lightweight Charts type definition
declare const LightweightCharts: any;

interface PriceChartViewProps {
  chartData?: ChartData;
}

const PriceChartView: React.FC<PriceChartViewProps> = ({ chartData }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartData || !chartContainerRef.current) return;
    
    // Convert OHLCV data to chart format
    const candleData = chartData.ohlcv.map(d => ({
      time: new Date(d.datetime).getTime() / 1000,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Convert volume data
    const volumeData = chartData.ohlcv.map(d => ({
      time: new Date(d.datetime).getTime() / 1000,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    // Have to convert time to Local only on markers. Dunno why :(
    const timeToLocal = (d: Date) => {
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    }

    const tradeMarkers = chartData.trades.map(trade => {
      const markers: any[] = [];
      
      markers.push({
        time: timeToLocal(new Date(trade.enter.datetime)) / 1000, 
        position: trade.enter.side === 'long' ? 'belowBar' : 'aboveBar',
        color: trade.enter.side === 'long' ? '#22C55E' : '#EF4444',
        shape: trade.enter.side === 'long' ? 'arrowUp' : 'arrowDown',
        text: `${trade.enter.side.toUpperCase()} ${trade.enter.size.toFixed(2)}`,
      });

      trade.exits.forEach(exit => {
        markers.push({
          time: timeToLocal(new Date(exit.datetime)) / 1000,
          position: trade.enter.side === 'long' ? 'aboveBar' : 'belowBar',
          color: exit.pnlcomm > 0 ? '#22C55E' : '#EF4444',
          shape: trade.enter.side === 'long' ? 'arrowDown' : 'arrowUp',
          text: `EXIT ${exit.size.toFixed(2)} (${exit.pnlcomm.toFixed(2)})`,
        });
      });

      return markers;
    }).flat();

    const containerWidth = chartContainerRef.current.clientWidth;
    const containerHeight = window.innerHeight - 100;

    const chartOptions = {
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
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
    };

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      ...chartOptions,
      width: containerWidth,
      height: containerHeight,
    });

    const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    const volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as an overlay
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })


    candlestickSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    LightweightCharts.createSeriesMarkers(candlestickSeries, tradeMarkers)

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData]);

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-screen text-[var(--vscode-descriptionForeground)]">
        No dataset available.
      </div>
    );
  }

  return (
    <div className="bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)] font-[var(--vscode-font-family)] p-3">
      <div className="flex flex-col space-y-5">
        <div className="flex flex-col space-y-2 mb-3">
          <h1 className="text-2xl font-bold">Price Chart</h1>
          <div className="text-sm text-[var(--vscode-descriptionForeground)]">
            {chartData.backtestId && (
              <div>Backtest ID: {chartData.backtestId}</div>
            )}
            <div>Dataset: {chartData.datasetPath.split('/').pop()}</div>
          </div>
        </div>

        <div className="bg-[var(--vscode-editor-inactiveSelectionBackground)] rounded-lg overflow-hidden">
          <div className="p-2">
            <div 
              ref={chartContainerRef} 
              className="w-full overflow-hidden"
              title="Drag to zoom in/out. Double-click to reset view."
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChartView; 