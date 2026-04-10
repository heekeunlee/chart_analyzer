/**
 * Finance Data Utility
 * Fetches data from Yahoo Finance via a CORS proxy or uses Finnhub if preferred.
 */

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

const NAME_MAP = {
  "삼성전자": "005930.KS",
  "SK하이닉스": "000660.KS",
  "현대차": "005380.KS",
  "기아": "000270.KS",
  "네이버": "035420.KS",
  "NAVER": "035420.KS",
  "카카오": "035720.KS",
  "K방산": "448930.KS"
};

export const fetchStockData = async (symbol) => {
  try {
    let ticker = symbol.trim();
    if (NAME_MAP[ticker]) {
      ticker = NAME_MAP[ticker];
    } else if (/^\d{6}$/.test(ticker)) {
      ticker = `${ticker}.KS`;
    } else {
      ticker = ticker.toUpperCase();
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!data?.chart?.result?.[0]) {
      throw new Error("데이터를 찾을 수 없습니다.");
    }

    const { timestamp, indicators } = data.chart.result[0];
    const { quote } = indicators;
    
    if (!timestamp) return [];

    return timestamp.map((time, i) => ({
      time: time,
      open: quote[0].open[i],
      high: quote[0].high[i],
      low: quote[0].low[i],
      close: quote[0].close[i],
    })).filter(d => d.open !== null && d.close !== null);
  } catch (err) {
    console.error("Finance API Error:", err);
    throw err;
  }
};
