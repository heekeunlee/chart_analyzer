import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Search, Brain, Settings, AlertCircle, TrendingUp } from 'lucide-react';
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

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    // setAnalysis(null);
    try {
      const data = await fetchStockData(symbol);
      setChartData(data);
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오지 못했습니다. 종목명을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Gemini API Key가 필요합니다. 설정에서 입력해 주세요.');
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
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800' }}>ChartVision Pro</h1>
          <p style={{ color: 'var(--text-muted)' }}>가장 신뢰받는 AI 차트 분석 솔루션</p>
        </div>
        <div className="toss-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={18} color="#666" />
          <input 
            type="password" 
            placeholder="Gemini API Key 입력" 
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.85rem', width: '220px', background: '#f5f5f7' }}
          />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
        <main>
          <div className="toss-card" style={{ marginBottom: '24px', display: 'flex', gap: '12px', padding: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="종목명 또는 코드 (예: 삼성전자, 005930)" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '14px', border: 'none', background: '#f5f5f7', fontSize: '1rem' }}
              />
            </div>
            <button className="btn-apple" onClick={handleSearch} style={{ padding: '0 30px' }}>조회</button>
          </div>

          <Chart data={chartData} symbol={symbol} />
          
          <button 
            className="btn-apple" 
            onClick={handleAnalyze} 
            disabled={loading || !chartData.length}
            style={{ width: '100%', height: '64px', background: '#0071e3', fontSize: '1.2rem', fontWeight: '700', borderRadius: '20px' }}
          >
            {loading ? 'AI 분석 리포트 생성 중...' : 'Gemini AI 차트 분석 실행'}
          </button>
        </main>

        <aside>
          {error && (
             <div className="toss-card" style={{ marginBottom: '24px', borderLeft: '4px solid #ff3b30' }}>
                <p style={{ color: '#ff3b30', fontSize: '0.9rem' }}>{error}</p>
             </div>
          )}

          {analysis ? (
            <div className="toss-card animate-up" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', background: analysis.signal === 'BUY' ? '#00c853' : analysis.signal === 'SELL' ? '#ff3b30' : '#ffcc00', color: '#fff' }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{analysis.signal} SIGNAL</h4>
                <p style={{ opacity: 0.9 }}>Confidence: {analysis.confidence}%</p>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Identified Pattern</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>{analysis.pattern_name}</p>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analysis Reason</p>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#333', marginBottom: '20px' }}>{analysis.reason}</p>
                
                <div style={{ background: '#f5f5f7', padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Target</span>
                    <p style={{ color: '#00c853', fontWeight: 800 }}>{analysis.prediction.target_price}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>Stop Loss</span>
                    <p style={{ color: '#ff3b30', fontWeight: 800 }}>{analysis.prediction.stop_loss}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="toss-card" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <TrendingUp size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>분석 실행 버튼을 누르면 AI가 기술적 리포트를 생성합니다.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
