import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Search, Brain, Settings, AlertCircle, TrendingUp } from 'lucide-react';
import { fetchStockData } from './utils/financeApi';
import { analyzeChart } from './utils/geminiApi';
import patternDb from './data/patterns.json';

// TradingView Widget Component
const TVWidget = ({ symbol }) => {
  const container = useRef();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    let tvSymbol = symbol;
    if (/^\d{6}$/.test(tvSymbol)) tvSymbol = `KRX:${tvSymbol}`;
    else tvSymbol = tvSymbol.toUpperCase();

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": "D",
      "timezone": "Asia/Seoul",
      "theme": "light",
      "style": "1",
      "locale": "ko",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="toss-card" style={{ height: '500px', padding: '10px', marginBottom: '24px' }}>
      <div className="tradingview-widget-container" ref={container} style={{ height: '100%', width: '100%' }}>
        <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
      </div>
    </div>
  );
};

function App() {
  const [symbol, setSymbol] = useState('005930');
  const [currentSymbol, setCurrentSymbol] = useState('005930');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    setAnalysis(null);
    setCurrentSymbol(symbol);
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Gemini API Key가 필요합니다.');
      return;
    }
    
    setLoading(true);
    setAnalysis(null);
    try {
      const data = await fetchStockData(currentSymbol);
      if (!data || data.length === 0) throw new Error("데이터를 가져오지 못했습니다.");

      // Simplified analysis flow
      const result = await analyzeChart(apiKey, "MOCK_IMAGE_DATA", patternDb);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('AI 분석 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800' }}>ChartVision Pro</h1>
          <p style={{ color: 'var(--text-muted)' }}>AI Market Intelligence</p>
        </div>
        <div className="toss-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={18} />
          <input 
            type="password" 
            placeholder="Gemini API Key" 
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', width: '200px' }}
          />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        <main>
          <div className="toss-card" style={{ marginBottom: '24px', display: 'flex', gap: '12px', padding: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="종목명 또는 코드 입력" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: 'none', background: '#f5f5f7' }}
              />
            </div>
            <button className="btn-apple" onClick={handleSearch}>검색</button>
          </div>

          <TVWidget symbol={currentSymbol} />
          
          <button className="btn-apple" onClick={handleAnalyze} disabled={loading} style={{ width: '100%', height: '60px', background: '#0071e3' }}>
            {loading ? 'AI 분석 중...' : 'Gemini AI 분석 실행'}
          </button>
        </main>

        <aside>
          {error && <div className="toss-card" style={{ marginBottom: '24px', color: 'red' }}>{error}</div>}
          {analysis && (
            <div className="toss-card">
              <h4>{analysis.signal} SIGNAL</h4>
              <p>{analysis.pattern_name}</p>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{analysis.reason}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
