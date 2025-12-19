# AI News Curator

Gemini API를 활용한 AI 뉴스 자동 큐레이션 서비스

## 셋업 가이드

### 1. GitHub Repository 생성
이 폴더의 파일들을 새 GitHub repository에 업로드합니다.

### 2. API 키 등록 (중요!)
1. Repository의 **Settings** → **Secrets and variables** → **Actions** 이동
2. **New repository secret** 클릭
3. Name: `GEMINI_API_KEY`
4. Secret: [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 API 키 입력
5. **Add secret** 클릭

> ⚠️ API 키는 코드에 절대 포함되지 않습니다. GitHub Secrets에 저장되어 Actions 실행 시에만 환경변수로 주입됩니다.

### 3. GitHub Pages 활성화
1. Repository의 **Settings** → **Pages** 이동
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)` 선택
4. **Save** 클릭

### 4. Actions 권한 설정
1. Repository의 **Settings** → **Actions** → **General** 이동
2. **Workflow permissions** 섹션에서 **Read and write permissions** 선택
3. **Save** 클릭

### 5. 첫 실행
1. Repository의 **Actions** 탭 이동
2. **Update AI News** workflow 선택
3. **Run workflow** 버튼 클릭하여 수동 실행

## 자동 갱신 스케줄

- 한국시간 기준 오전 8시, 오후 8시 자동 실행
- 수동 실행: Actions 탭에서 **Run workflow** 클릭

## 파일 구조

```
├── .github/
│   └── workflows/
│       └── update-news.yml    # GitHub Actions 워크플로우
├── scripts/
│   └── fetch-news.js          # Gemini API 호출 스크립트
├── data/
│   └── news.json              # 수집된 뉴스 데이터
├── index.html                 # 웹 페이지
└── README.md
```

## 보안

- API 키는 GitHub Secrets에만 저장됨
- 코드, 커밋 히스토리, Actions 로그에 API 키 노출 없음
- 클라이언트(웹페이지)에서 API 키 접근 불가
