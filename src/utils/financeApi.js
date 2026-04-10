/**
 * Finance Data Utility
 * Fetches data from Yahoo Finance via a CORS proxy or uses Finnhub if preferred.
 */

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export const fetchStockData = async (symbol) => {
  try {
    // Basic format conversion: 삼성전자 -> 005930.KS
    // For now, assume the user provides the format or we guess.
    let ticker = symbol.toUpperCase();
    if (/^\d{6}$/.test(ticker)) {
      ticker = `${ticker}.KS`; // Default to KOSPI for numbers
    }

    const startTime = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days
    const endTime = Math.floor(Date.now() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!data.chart || !data.chart.result) {
      throw new Error("Data not found");
    }

    const { timestamp, indicators } = data.chart.result[0];
    const { quote } = indicators;
    
    return timestamp.map((time, i) => ({
      time: time, // Epoch
      open: quote[0].open[i],
      high: quote[0].high[i],
      low: quote[0].low[i],
      close: quote[0].close[i],
    })).filter(d => d.open && d.close);
  } catch (err) {
    console.error("Finance API Error:", err);
    throw err;
  }
};
