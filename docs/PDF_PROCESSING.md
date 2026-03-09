# PDF 처리 가이드

## 개요

에이쁠의 PDF 처리 시스템은 강의 자료에서 텍스트를 추출하고, AI 문제 생성을 위해 최적화된 청크로 분할합니다.

## 아키텍처

```
사용자 PDF 업로드
    ↓
클라이언트 유효성 검사 (파일 타입, 크기)
    ↓
API Route (/api/pdf-extract)
    ↓
pdf-parse로 텍스트 추출
    ↓
청킹 알고리즘 적용
    ↓
결과 반환 (텍스트 + 청크 + 메타데이터)
```

## 주요 기능

### 1. PDF 텍스트 추출

**라이브러리**: `pdf-parse`

- 모든 페이지에서 텍스트 추출
- 한글/영문 모두 지원
- 이미지 기반 PDF 감지 및 에러 처리

### 2. 스마트 청킹 (Chunking)

**목적**: AI 모델의 컨텍스트 제한을 고려한 텍스트 분할

#### 청킹 옵션

```typescript
interface ChunkingOptions {
  maxChunkSize: number;        // 기본값: 4000 문자
  overlapSize: number;          // 기본값: 200 문자
  preserveParagraphs: boolean;  // 기본값: true
}
```

#### 청킹 전략

1. **문단 기반 분할** (기본)
   - 문단 구조를 유지하면서 분할
   - 문단이 너무 길면 문장 단위로 재분할
   - 의미 단위 보존으로 AI 이해도 향상

2. **오버랩 처리**
   - 청크 간 200자 오버랩으로 문맥 연속성 유지
   - 경계에서 정보 손실 방지

3. **크기 최적화**
   - GPT-4 토큰 제한 고려 (4000자 ≈ 1000 토큰)
   - 각 청크가 독립적으로 분석 가능하도록 설계

## API 사용법

### 엔드포인트

```
POST /api/pdf-extract
```

### 요청

```typescript
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("maxChunkSize", "4000");
formData.append("overlapSize", "200");
formData.append("preserveParagraphs", "true");

const response = await fetch("/api/pdf-extract", {
  method: "POST",
  body: formData
});
```

### 응답

```typescript
interface PDFExtractResult {
  text: string;              // 전체 추출된 텍스트
  chunks: string[];          // 청크 배열
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount: number;
    totalCharacters: number;
    chunkCount: number;
    extractedAt: string;
  };
}
```

### 에러 응답

```typescript
interface PDFExtractionError {
  error: string;
  code: PDFErrorCode;
  details?: string;
}

type PDFErrorCode =
  | "FILE_TOO_LARGE"      // 파일 크기 초과 (10MB)
  | "INVALID_FILE_TYPE"   // PDF가 아님
  | "EXTRACTION_FAILED"   // 추출 실패
  | "NO_TEXT_FOUND"       // 텍스트 없음 (이미지 PDF)
  | "PARSING_ERROR"       // 파싱 에러
  | "UNKNOWN_ERROR";      // 알 수 없는 에러
```

## 클라이언트 사용 예시

```typescript
import { extractPDFText } from "@/lib/api-client";

async function handlePDFUpload(file: File) {
  try {
    const result = await extractPDFText(file, {
      maxChunkSize: 4000,
      overlapSize: 200,
      preserveParagraphs: true
    });

    console.log(`추출 완료: ${result.metadata.pageCount}페이지`);
    console.log(`청크 수: ${result.chunks.length}`);
    
    // 청크를 AI 모델로 전송
    for (const chunk of result.chunks) {
      await generateQuestionsFromChunk(chunk);
    }
  } catch (error) {
    console.error("PDF 추출 실패:", error);
  }
}
```

## 컴포넌트

### PDFUploader

드래그 앤 드롭 지원 PDF 업로드 컴포넌트

```typescript
import { PDFUploader } from "@/components/upload/pdf-uploader";

<PDFUploader
  onExtractComplete={(result) => {
    // 추출 완료 후 처리
  }}
  onError={(error) => {
    // 에러 처리
  }}
/>
```

## 제약사항

- **최대 파일 크기**: 10MB
- **지원 형식**: PDF만 (application/pdf)
- **텍스트 기반**: 이미지 기반 PDF는 OCR 미지원
- **처리 시간**: 평균 2-5초 (파일 크기에 따라 다름)

## 성능 최적화

1. **클라이언트 사이드 검증**: 서버 요청 전 파일 유효성 검사
2. **청크 캐싱**: 동일 PDF 재처리 방지 (향후 구현 예정)
3. **스트리밍**: 대용량 PDF를 위한 스트리밍 처리 (향후 구현 예정)

## 향후 개선 계획

- [ ] OCR 지원 (이미지 기반 PDF)
- [ ] 표/그림 인식 및 추출
- [ ] PDF 메타데이터 추출 (제목, 저자, 키워드)
- [ ] 다중 파일 업로드
- [ ] 진행률 표시
- [ ] Supabase Storage 연동
- [ ] 청크 캐싱 시스템

## 문제 해결

### "NO_TEXT_FOUND" 에러

- **원인**: 이미지 기반 PDF 또는 보호된 파일
- **해결**: OCR 기능 추가 예정 또는 텍스트 기반 PDF 사용

### "FILE_TOO_LARGE" 에러

- **원인**: 10MB 초과
- **해결**: PDF 압축 또는 페이지 분할

### 느린 처리 속도

- **원인**: 대용량 파일, 많은 페이지
- **해결**: 파일 크기 최적화, 서버 타임아웃 증가

## 참고 자료

- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Chunking Strategies for LLM Applications](https://www.pinecone.io/learn/chunking-strategies/)
