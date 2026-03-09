# 🔑 Gemini API 테스트 가이드

## 1. API 키 확인

### Windows (PowerShell)
```powershell
# .env.local 파일에서 API 키 확인
Select-String -Path ".env.local" -Pattern "GEMINI_API_KEY"
```

### Mac/Linux (Terminal)
```bash
# .env.local 파일에서 API 키 확인
grep "GEMINI_API_KEY" .env.local
```

---

## 2. curl 테스트 (직접 API 호출)

### Windows (PowerShell)
```powershell
# API 키를 변수에 저장 (보안)
$API_KEY = "AIzaSyC..." # 실제 API 키 입력

# Gemini API 테스트
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$API_KEY" `
  -H 'Content-Type: application/json' `
  -d '{
    "contents": [{
      "parts": [{
        "text": "안녕하세요? 간단한 테스트입니다."
      }]
    }]
  }'
```

### Mac/Linux (Terminal)
```bash
# API 키를 변수에 저장 (보안)
export API_KEY="AIzaSyC..." # 실제 API 키 입력

# Gemini API 테스트
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "안녕하세요? 간단한 테스트입니다."
      }]
    }]
  }'
```

---

## 3. 응답 확인

### ✅ 성공 (200 OK)
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "안녕하세요! 테스트가 성공적으로 완료되었습니다."
          }
        ]
      }
    }
  ]
}
```

### ❌ 실패 케이스

#### 404 Not Found
```json
{
  "error": {
    "code": 404,
    "message": "models/gemini-1.5-flash is not found for API version v1beta",
    "status": "NOT_FOUND"
  }
}
```
**원인**: 잘못된 모델명  
**해결**: 모델명을 `gemini-1.5-flash` (접두사 없이)로 변경

#### 401 Unauthorized
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid",
    "status": "UNAUTHENTICATED"
  }
}
```
**원인**: 잘못된 API 키  
**해결**: https://aistudio.google.com/app/apikey 에서 새 API 키 발급

#### 403 Forbidden (지역 제한)
```json
{
  "error": {
    "code": 403,
    "message": "The API is not available in your region",
    "status": "PERMISSION_DENIED"
  }
}
```
**원인**: 지역 제한  
**해결**: 
1. VPN 사용 (미국/유럽 연결)
2. Vercel 배포 시 리전을 `us-east-1`로 설정

#### 429 Too Many Requests
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```
**원인**: API 할당량 초과  
**해결**: 1분 후 다시 시도, 또는 무료 할당량 확인

---

## 4. 사용 가능한 모델 목록 확인

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$API_KEY"
```

**결과 예시**:
```json
{
  "models": [
    {
      "name": "models/gemini-1.5-flash",
      "displayName": "Gemini 1.5 Flash",
      "description": "Fast and versatile..."
    },
    {
      "name": "models/gemini-1.5-flash-latest",
      "displayName": "Gemini 1.5 Flash Latest",
      "description": "Latest version..."
    },
    {
      "name": "models/gemini-1.5-pro",
      "displayName": "Gemini 1.5 Pro",
      "description": "Most capable..."
    }
  ]
}
```

---

## 5. 프로젝트 내 테스트

### Node.js 스크립트로 테스트
`test-gemini.js` 파일 생성:

```javascript
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log("🔑 API Key:", apiKey ? `${apiKey.substring(0, 4)}****... (${apiKey.length}자)` : "❌ 없음");
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY가 .env.local에 없습니다.");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\n📤 [${modelName}] 테스트 중...`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("안녕하세요? 테스트입니다.");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ [${modelName}] 성공!`);
      console.log(`응답: ${text.substring(0, 100)}...`);
      break;
      
    } catch (error) {
      console.error(`❌ [${modelName}] 실패:`, error.message);
    }
  }
}

testGemini();
```

**실행**:
```bash
node test-gemini.js
```

---

## 6. 서버 로그 확인

개발 서버를 실행하고 브라우저 콘솔 및 터미널 로그를 확인하세요:

```bash
npm run dev
```

**로그에서 확인할 사항**:
```
🔑 [API Key] 확인: AIza**** (길이: 39자)
🌍 [Region] Node.js 버전: v20.10.0
🔄 [Gemini] 시도할 모델 목록: gemini-1.5-flash, gemini-1.5-flash-latest, ...
```

---

## 7. 트러블슈팅 체크리스트

- [ ] API 키가 `.env.local`에 정확히 설정되어 있는가?
- [ ] API 키는 Google AI Studio에서 발급받은 것인가? (Vertex AI X)
- [ ] 서버를 재시작했는가? (환경 변수 반영)
- [ ] curl 테스트로 직접 API 호출이 성공하는가?
- [ ] 사용 가능한 모델 목록에 `gemini-1.5-flash`가 있는가?
- [ ] 지역 제한 (403)이 발생하는가? → VPN 사용
- [ ] 무료 할당량이 남아있는가? → Google AI Studio 확인

---

**API 키 발급**: https://aistudio.google.com/app/apikey  
**Gemini API 문서**: https://ai.google.dev/gemini-api/docs
