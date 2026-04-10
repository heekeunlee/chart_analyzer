import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Search, Brain, Settings, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Chart } from './components/Chart';
import { fetchStockData } from './utils/financeApi';
import { analyzeChart } from './utils/geminiApi';
import patternDb from './data/patterns.json';

function App() {
  const [symbol, setSymbol] = useState('005930'); // Default Samsung
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
    try {
      const data = await fetchStockData(symbol);
      setChartData(data);
    } catch (err) {
      setError('종목 데이터를 불러오는 데 실패했습니다.');
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
      <header style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '12px' }}>ChartVision Pro</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>AI 기반의 프리미엄 차트 분석 솔루션</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Main Content */}
        <main>
          <div className="toss-card" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="종목명 또는 심볼 입력 (예: 삼성전자, AAPL)" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border)', background: '#f9f9f9', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            <button className="btn-apple" onClick={handleSearch} disabled={loading}>
              {loading ? '로딩중...' : '조회'}
            </button>
          </div>

          {chartData.length > 0 && <Chart data={chartData} symbol={symbol} />}
          
          <div className="toss-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1d1d1f 0%, #434345 100%)', color: 'white' }}>
            <Brain size={32} style={{ marginBottom: '16px', color: 'var(--accent)' }} />
            <h3 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>AI 패턴 분석 시작하기</h3>
            <p style={{ opacity: 0.8, marginBottom: '24px' }}>차트 이미지를 분석하여 최적의 매매 타이밍을 제안합니다.</p>
            <button 
              className="btn-apple" 
              onClick={handleAnalyze} 
              disabled={loading || !chartData.length}
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {loading ? 'AI 분석 중...' : '분석 실행'}
            </button>
          </div>
        </main>

        {/* Sidebar */}
        <aside>
          {error && (
            <div className="toss-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--danger)', background: '#fff' }}>
              <div style={{ display: 'flex', gap: '8px', color: var(--danger) }}>
                <AlertCircle size={20} />
                <span style={{ fontWeight: 600 }}>Error</span>
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>{error}</p>
            </div>
          )}

          <div className="toss-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Settings size={20} color="var(--text-muted)" />
              <h4 style={{ fontWeight: 700 }}>설정</h4>
            </div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Gemini API Key</label>
            <input 
              type="password" 
              placeholder="API Key 입력" 
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f9f9f9', marginBottom: '8px' }}
            />
            <p style={{ fontSize: '0.7rem' }}>입력한 키는 브라우저에만 저장됩니다.</p>
          </div>

          {analysis && (
            <div className="toss-card animate-up" style={{ borderTop: `6px solid ${analysis.signal === 'BUY' ? 'var(--success)' : analysis.signal === 'SELL' ? 'var(--danger)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>AI 의견</h4>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '10px', 
                  background: analysis.signal === 'BUY' ? '#e8f5e9' : analysis.signal === 'SELL' ? '#ffebee' : '#fff8e1',
                  color: analysis.signal === 'BUY' ? 'var(--success)' : analysis.signal === 'SELL' ? 'var(--danger)' : '#b8860b',
                  fontWeight: 800
                }}>
                  {analysis.signal}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>발견된 패턴</p>
                <p style={{ fontWeight: 700 }}>{analysis.pattern_name}</p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>기술적 분석 근거</p>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#4b4b4b' }}>{analysis.reason}</p>
              </div>

              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>목표가</p>
                    <p style={{ fontWeight: 700, color: 'var(--success)' }}>{analysis.prediction.target_price}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>손절가</p>
                    <p style={{ fontWeight: 700, color: 'var(--danger)' }}>{analysis.prediction.stop_loss}</p>
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
