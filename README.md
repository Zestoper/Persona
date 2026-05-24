# Persona — AI 페르소나 챗봇 빌더

나만의 AI 캐릭터를 만들고, 그 캐릭터와 실시간으로 대화할 수 있는 풀스택 웹 서비스입니다.

## 주요 기능

- **페르소나 생성** — 이름, 성격, 배경스토리, 말투를 입력하면 AI 시스템 프롬프트 자동 생성
- **실시간 스트리밍 채팅** — WebSocket 기반으로 AI 답변을 타이핑하듯 실시간 출력
- **대화 기록 유지** — 페이지 새로고침 후에도 이전 대화가 그대로 유지
- **마켓플레이스** — 공개 페르소나 탐색, 인기순/최신순 정렬, 이름 검색
- **아바타 시스템** — DiceBear 자동 생성 (7가지 스타일) 또는 직접 이미지 업로드
- **계정 관리** — 회원가입/로그인, 닉네임·비밀번호 변경, 회원탈퇴
- **모바일 반응형** — 모든 페이지 모바일 최적화

## 기술 스택

### Backend
| 항목 | 기술 |
|---|---|
| 프레임워크 | FastAPI |
| 데이터베이스 | PostgreSQL + SQLAlchemy (async) |
| 인증 | JWT (python-jose) + bcrypt |
| AI | Groq API (llama-3.3-70b-versatile) |
| 실시간 통신 | WebSocket |

### Frontend
| 항목 | 기술 |
|---|---|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios |
| 아바타 | DiceBear API |

## 실행 방법

### 사전 준비
- Python 3.11+
- Node.js 18+
- PostgreSQL

### 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 아래 값들을 채워주세요

# 서버 실행
uvicorn app.main:app --reload
```

### 프론트엔드

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 환경변수 (.env)

```env
DATABASE_URL=postgresql+asyncpg://유저:비밀번호@localhost:5432/persona
SECRET_KEY=랜덤한_시크릿_키_32자_이상
GROQ_API_KEY=gsk_로_시작하는_Groq_API_키
DEBUG=True
```

> **Groq API 키 발급**: [console.groq.com](https://console.groq.com) → 무료 회원가입 후 발급

## 프로젝트 구조

```
Persona/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # 라우터 (auth, personas, chat)
│   │   ├── models/             # SQLAlchemy 모델
│   │   ├── schemas/            # Pydantic 스키마
│   │   ├── services/           # 비즈니스 로직
│   │   └── core/               # 설정, 보안
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/              # 페이지 컴포넌트
        ├── components/         # 공통 컴포넌트
        ├── context/            # 전역 상태 (Auth, Toast)
        ├── hooks/              # 커스텀 훅
        └── api/                # Axios 클라이언트
```

## 화면 구성

| 경로 | 설명 |
|---|---|
| `/` | 마켓플레이스 (공개 페르소나 탐색) |
| `/create` | 페르소나 만들기 |
| `/my` | 내 페르소나 목록 |
| `/chat/:id` | 페르소나와 채팅 |
| `/profile` | 마이페이지 (계정 설정) |
