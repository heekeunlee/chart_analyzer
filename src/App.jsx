import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Search, Brain, Settings, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
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
    
    // Map internal ticker to TV format
    let tvSymbol = symbol;
    if (/^\d{6}$/.test(symbol)) tvSymbol = `KRX:${symbol}`;
    else if (symbol.includes('.')) tvSymbol = symbol.split('.')[0];

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
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    setAnalysis(null);
    setCurrentSymbol(symbol);
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Gemini API Key가 필요합니다. 설정에서 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setAnalysis(null);
    try {
      // For AI analysis, we still need raw data to render a temporary canvas
      // or we can just send the ticker and ask Gemini to "imagine" based on its knowledge
      // But better: fetch fresh data for analysis
      const data = await fetchStockData(currentSymbol);
      if (!data || data.length === 0) throw new Error("분석할 데이터를 가져오지 못했습니다.");

      // Hidden div for screenshot (since TV Widget is an iframe)
      const offscreen = document.createElement('div');
      offscreen.style.position = 'fixed';
      offscreen.style.left = '-9999px';
      offscreen.style.width = '800px';
      offscreen.style.height = '400px';
      document.body.appendChild(offscreen);

      const { createChart } = await import('lightweight-charts');
      const chart = createChart(offscreen, { width: 800, height: 400 });
      const series = chart.addCandlestickSeries();
      series.setData(data);
      
      const canvas = await html2canvas(offscreen);
      const base64 = canvas.toDataURL('image/png');
      
      document.body.removeChild(offscreen);
      chart.remove();

      const result = await analyzeChart(apiKey, base64, patternDb);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('AI 분석 도중 오류가 발생했습니다. API 키나 네트워크를 확인해주세요.');
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
          <p style={{ color: 'var(--text-muted)' }}>Global AI Market Intelligence</p>
        </div>
        
        <div className="toss-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {apiKey ? <CheckCircle2 size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--warning)" />}
          <div style={{ position: 'relative' }}>
             <input 
              type={showKey ? "text" : "password"} 
              placeholder="Gemini API Key" 
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              style={{ padding: '8px 40px 8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', width: '200px' }}
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
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
                style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: 'none', background: '#f5f5f7', outline: 'none' }}
              />
            </div>
            <button className="btn-apple" onClick={handleSearch} style={{ height: '48px', padding: '0 30px' }}>검색</button>
          </div>

          <TVWidget symbol={currentSymbol} />
          
          <button 
            className="btn-apple" 
            onClick={handleAnalyze} 
            disabled={loading}
            style={{ width: '100%', height: '60px', background: 'linear-gradient(135deg, #2997ff 0%, #0071e3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem' }}
          >
            {loading ? <div className="spinner"></div> : <Brain size={22} />}
            {loading ? 'AI 분석 리포트 생성 중...' : 'Gemini AI 패턴 분석 실행'}
          </button>
        </main>

        <aside>
          {error && (
            <div className="toss-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--danger)', background: '#fff' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>{error}</p>
            </div>
          )}

          {analysis ? (
            <div className="toss-card animate-up" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ 
                padding: '24px', 
                background: analysis.signal === 'BUY' ? 'var(--success)' : analysis.signal === 'SELL' ? 'var(--danger)' : 'var(--warning)',
                color: '#fff'
              }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analysis.signal} SIGNAL</h4>
                <p style={{ opacity: 0.9 }}>신뢰도: {analysis.confidence}%</p>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>식별된 패턴</label>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analysis.pattern_name}</p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>전략 및 근거</label>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#444' }}>{analysis.reason}</p>
                </div>
                <div style={{ background: '#f5f5f7', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>목표가</label>
                    <p style={{ fontWeight: 700, color: 'var(--success)' }}>{analysis.prediction.target_price}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>손절가</label>
                    <p style={{ fontWeight: 700, color: 'var(--danger)' }}>{analysis.prediction.stop_loss}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="toss-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
              <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
              <p>종목을 검색하고 AI 분석을 실행하면 이곳에 상세 리포트가 표시됩니다.</p>
            </div>
          )}

          <div style={{ marginTop: '30px', padding: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <p>※ 모든 분석 데이터는 참고용이며 투자 결과에 대한 책임은 본인에게 있습니다.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
