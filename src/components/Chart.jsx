import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export const Chart = ({ data, symbol }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !chartContainerRef.current) return;

    let chart;
    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
        },
        width: chartContainerRef.current.clientWidth || 600,
        height: 400,
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      candleSeries.setData(data);
      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chart && chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) chart.remove();
      };
    } catch (err) {
      console.error("Chart Rendering Error:", err);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="toss-card" style={{ width: '100%', marginBottom: '24px', textAlign: 'center', padding: '100px 0' }}>
         <p style={{ color: 'var(--text-muted)' }}>차트 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="toss-card" style={{ width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{symbol || "Stock Chart"}</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Daily Candlesticks</span>
      </div>
      <div ref={chartContainerRef} style={{ position: 'relative' }} id="chart-screenshot-area" />
    </div>
  );
};
