import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas'; // Make sure this is installed
import { Search, Brain, Settings, AlertCircle } from 'lucide-react';
import { Chart } from './components/Chart';
import { fetchStockData } from './utils/financeApi';
import { analyzeChart } from './utils/geminiApi';
import patternDb from './data/patterns.json';

function App() {
  const [symbol, setSymbol] = useState('005930');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [error, setError] = useState('');

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const data = await fetchStockData(symbol);
      if (!data || data.length === 0) {
        setError('종목을 찾을 수 없거나 데이터가 없습니다.');
        setChartData([]);
      } else {
        setChartData(data);
      }
    } catch (err) {
      setError('데이터 로딩 중 오류가 발생했습니다. 종목명을 확인해주세요.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Gemini API Key가 필요합니다. 설정에서 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setAnalysis(null);
    try {
      const element = document.getElementById('chart-screenshot-area');
      if (!element) throw new Error("Chart area not found");
      
      const canvas = await html2canvas(element);
      const base64 = canvas.toDataURL('image/png');
      
      const result = await analyzeChart(apiKey, base64, patternDb);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('AI 분석 도중 오류가 발생했습니다. API 키가 유효한지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '3.3rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>ChartVision Pro</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>AI 기반의 프리미엄 차트 분석 솔루션</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        <main>
          <div className="toss-card" style={{ marginBottom: '24px', display: 'flex', gap: '12px', padding: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="종목명 또는 코드 (예: 삼성전자, AAPL)" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fcfcfc', outline: 'none', fontSize: '1rem', transition: '0.2s' }}
              />
            </div>
            <button className="btn-apple" onClick={handleSearch} disabled={loading} style={{ padding: '0 24px' }}>
              {loading ? '...' : '조회'}
            </button>
          </div>

          <Chart data={chartData} symbol={symbol} />
          
          <div className="toss-card" style={{ textAlign: 'center', background: '#1d1d1f', color: 'white', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.3 }}></div>
            <Brain size={40} style={{ marginBottom: '20px', color: 'var(--accent)' }} />
            <h3 style={{ marginBottom: '12px', fontSize: '1.6rem', fontWeight: '700' }}>AI 차트 패턴 분석</h3>
            <p style={{ opacity: 0.7, marginBottom: '28px', fontSize: '1.05rem', lineHeight: '1.6' }}>현재 차트의 형태를 분석하여<br />패턴 식별 및 매매 전략을 도출합니다.</p>
            <button 
              className="btn-apple" 
              onClick={handleAnalyze} 
              disabled={loading || !chartData.length}
              style={{ background: 'var(--accent)', color: 'white', width: '100%', height: '56px', fontSize: '1.1rem' }}
            >
              {loading ? 'AI 분석 분석 중...' : '분석 실행'}
            </button>
          </div>
        </main>

        <aside>
          {error && (
            <div className="toss-card" style={{ marginBottom: '32px', borderLeft: '5px solid var(--danger)', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ display: 'flex', gap: '10px', color: 'var(--danger)', alignItems: 'center', marginBottom: '8px' }}>
                <AlertCircle size={22} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>안내</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.5' }}>{error}</p>
            </div>
          )}

          <div className="toss-card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Settings size={22} color="var(--text-muted)" />
              <h4 style={{ fontWeight: 750, fontSize: '1.1rem' }}>API 설정</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>분석 기능을 사용하려면 Gemini API Key가 필요합니다.</p>
            <input 
              type="password" 
              placeholder="Google AI API Key" 
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f9f9f9', marginBottom: '12px', fontSize: '0.9rem' }}
            />
            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>키가 없으신가요? 여기서 무료로 받기 →</a>
          </div>

          {analysis && (
            <div className="toss-card animate-up" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ 
                padding: '24px', 
                background: analysis.signal === 'BUY' ? 'linear-gradient(135deg, #00c853 0%, #00e676 100%)' : analysis.signal === 'SELL' ? 'linear-gradient(135deg, #ff3b30 0%, #ff5252 100%)' : 'linear-gradient(135deg, #ffcc00 0%, #ffeb3b 100%)',
                color: analysis.signal === 'WAIT' ? '#000' : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '0.05em' }}>{analysis.signal}</span>
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Confidence: {analysis.confidence}%</span>
                </div>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identified Pattern</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{analysis.pattern_name}</p>
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Reason</p>
                  <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#333' }}>{analysis.reason}</p>
                </div>

                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '16px', border: '1px solid #eee' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target</p>
                      <p style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>{analysis.prediction.target_price}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Stop Loss</p>
                      <p style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1.1rem' }}>{analysis.prediction.stop_loss}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
