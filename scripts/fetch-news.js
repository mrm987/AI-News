const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COOLDOWN_HOURS = 4; // 최소 4시간 간격

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  process.exit(1);
}

// 쿨타임 체크
function checkCooldown() {
  const dataPath = path.join(__dirname, '..', 'data', 'news.json');
  
  if (!fs.existsSync(dataPath)) return true; // 파일 없으면 실행
  
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    if (!data.updatedAt) return true;
    
    const lastUpdate = new Date(data.updatedAt);
    const now = new Date();
    const hoursSince = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursSince < COOLDOWN_HOURS) {
      console.log(`Cooldown active: ${hoursSince.toFixed(1)}h since last update (minimum: ${COOLDOWN_HOURS}h)`);
      console.log('Skipping API call.');
      return false;
    }
    
    return true;
  } catch (e) {
    return true; // 파싱 에러면 실행
  }
}

const prompt = `당신은 AI 뉴스 큐레이터입니다. 지난 24시간 동안의 AI 관련 주요 소식을 검색하고 한국어로 요약해주세요.

다음 JSON 형식으로 정확히 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "news": [
    {
      "title": "뉴스 제목",
      "summary": "핵심 내용 2-3문장 요약",
      "importance": "왜 중요한지 간단히 설명",
      "source": "출처 (알 수 있는 경우)",
      "url": "관련 링크 (알 수 있는 경우)"
    }
  ]
}

검색할 주요 키워드: AI model release, LLM, OpenAI, Anthropic, Google AI, Meta AI, AI regulation, AI research breakthrough

중요도가 높은 순서대로 5-10개 소식을 정리해주세요. 단순 제품 업데이트보다는 기술적 혁신이나 업계에 영향을 미치는 뉴스를 우선해주세요.`;

async function fetchNews() {
  // 쿨타임 체크 (테스트 중 비활성화)
  // if (!checkCooldown()) {
  //   process.exit(0);
  // }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          tools: [{
            google_search: {}
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      } catch (e) {
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 200)}`);
      }
    }

    const data = await response.json();
    console.log('API Response received, processing...');
    
    // 응답에서 텍스트 추출
    let resultText = '';
    if (data.candidates && data.candidates[0]?.content?.parts) {
      resultText = data.candidates[0].content.parts
        .map(part => part.text || '')
        .join('\n');
    }

    if (!resultText) {
      throw new Error('No text found in response');
    }

    // JSON 파싱 시도
    let newsData;
    try {
      // JSON 블록 추출 (```json ... ``` 형태일 수 있음)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // JSON 파싱 실패시 원본 텍스트로 저장
      newsData = {
        news: [],
        rawContent: resultText,
        parseError: true
      };
    }

    // 메타데이터 추가
    const output = {
      updatedAt: new Date().toISOString(),
      ...newsData
    };

    // data 디렉토리 생성
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // JSON 파일 저장
    const outputPath = path.join(dataDir, 'news.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    
    console.log(`Successfully updated news.json at ${output.updatedAt}`);
    console.log(`Found ${newsData.news?.length || 0} news items`);

  } catch (error) {
    console.error('Error fetching news:', error.message);
    process.exit(1);
  }
}

fetchNews();
