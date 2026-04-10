import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeChart = async (apiKey, imageBase64, patternDb) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    당신은 전문 주식 트레이더입니다. 첨부된 차트 이미지를 분석하여 다음 형식의 JSON으로만 응답하세요.
    말투는 친절하고 전문적이어야 합니다.
    
    데이터베이스에 있는 패턴과 비교하세요: ${JSON.stringify(patternDb)}

    응답 형식:
    {
      "pattern_id": "발견된 패턴 ID",
      "pattern_name": "패턴 이름",
      "signal": "BUY / SELL / WAIT",
      "confidence": "0-100",
      "reason": "기술적 분석 근거를 자세히 설명 (캔들, 이동평균선, 거래량 등 포함)",
      "prediction": {
        "target_price": "목표가",
        "stop_loss": "손절가",
        "description": "향후 예상 시나리오"
      }
    }
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64.split(",")[1],
        mimeType: "image/png",
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();
  
  // Clean JSON
  const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
  return JSON.parse(jsonStr);
};
