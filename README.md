# Persona — AI 페르소나 챗봇 빌더

나만의 AI 캐릭터를 만들고, 그 캐릭터와 실시간으로 대화할 수 있는 풀스택 웹 서비스입니다.

## 스크린샷

| 랜딩 페이지 | 마켓플레이스 |
|---|---|
| ![랜딩 페이지](docs/screenshots/landing.png) | ![마켓플레이스](docs/screenshots/marketplace.png) |

| 로그인 | 요금제 |
|---|---|
| ![로그인](docs/screenshots/login.png) | ![요금제](docs/screenshots/pricing.png) |

| 모바일 |
|---|
| ![모바일](docs/screenshots/mobile.png) |

## 주요 기능

| 기능 | 설명 |
|---|---|
| 페르소나 생성 | 이름·성격·배경스토리·말투를 입력하면 AI 시스템 프롬프트 자동 생성 |
| AI 필드 자동 채우기 | 이름만 입력하면 Groq AI가 성격·배경·말투를 자동으로 제안 |
| 실시간 스트리밍 채팅 | WebSocket 기반으로 AI 답변을 타이핑하듯 실시간 출력 |
| 대화 기록 유지 | 페이지 새로고침 후에도 이전 대화가 그대로 유지 |
| 마켓플레이스 | 공개 페르소나 탐색, 인기순/최신순 정렬, 이름·태그 검색 |
| 컬렉션 | 테마별로 큐레이션된 페르소나 묶음 (힐링·학습·건강·연애 등 19개+) |
| AI 자동 컬렉션 분류 | 공개 페르소나 생성 시 Groq AI가 어울리는 컬렉션에 자동 추가 |
| 페르소나 복사 | 공개 페르소나를 내 계정으로 포크(복사)하여 커스터마이징 |
| 소셜 로그인 | 카카오·구글 OAuth2 소셜 로그인 지원 |
| 아바타 시스템 | DiceBear 자동 생성 (7가지 스타일) 또는 직접 이미지 업로드 |
| 즐겨찾기 | 마음에 드는 공개 페르소나를 즐겨찾기에 저장 |
| 신고 기능 | 부적절한 페르소나 신고 및 관리자 처리 |
| 관리자 페이지 | 통계 대시보드·신고 관리·유저 관리·페르소나 관리·컬렉션 관리 |
| 다크/라이트 모드 | 시스템 설정 연동 + 수동 전환 |
| 모바일 반응형 | 햄버거 메뉴, 슬라이드 드로어 등 모바일 최적화 |
| 서버 연결 상태 | 로그인 화면에서 백엔드 서버 연결 여부 실시간 표시 |

## 기술 스택

### Backend
| 항목 | 기술 |
|---|---|
| 프레임워크 | FastAPI |
| 데이터베이스 | PostgreSQL + SQLAlchemy (async) |
| 인증 | JWT (python-jose) + bcrypt + OAuth2 (카카오·구글) |
| AI | Groq API (llama-3.3-70b-versatile) |
| 실시간 통신 | WebSocket |
| HTTP 클라이언트 | httpx (소셜 로그인 토큰 교환) |

### Frontend
| 항목 | 기술 |
|---|---|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios |
| 스타일 | Inline CSS + Tailwind CSS |
| 아바타 | DiceBear API |

## 화면 구성

| 경로 | 설명 |
|---|---|
| `/` | 랜딩 페이지 (서비스 소개, 데모 애니메이션) |
| `/marketplace` | 마켓플레이스 (공개 페르소나 탐색) |
| `/persona/:id` | 페르소나 상세 (소개·신고·복사) |
| `/collections` | 컬렉션 목록 (테마별 큐레이션) |
| `/collections/:id` | 컬렉션 상세 (소속 페르소나 목록) |
| `/create` | 페르소나 만들기 |
| `/my` | 내 페르소나 목록 (컬렉션 소속 배지 표시) |
| `/edit/:id` | 페르소나 수정 |
| `/chat/:id` | 페르소나와 채팅 |
| `/conversations` | 내 대화 목록 |
| `/profile` | 마이페이지 (계정 설정) |
| `/pricing` | 요금제 페이지 |
| `/admin` | 관리자 페이지 (관리자 계정 전용) |

## 프로젝트 구조

```
Persona/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth, personas, chat, reports, conversations, admin, collections
│   │   ├── models/             # User, Persona, Message, Conversation, Report, Favorite, Collection
│   │   ├── schemas/            # Pydantic 스키마
│   │   ├── services/           # 비즈니스 로직 (persona_service, chat_service)
│   │   └── core/               # 설정, 보안, JWT
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/              # 페이지 컴포넌트 (14개)
        ├── components/         # Navbar, PersonaCard, PersonaAvatar, Skeleton 등 공통 컴포넌트
        ├── context/            # AuthContext, ToastContext, ThemeContext
        ├── hooks/              # useThemeColors, useIsMobile
        └── api/                # Axios 클라이언트 (401 자동 로그아웃)
```

## 실행 방법

### 사전 준비
- Python 3.11+
- Node.js 18+
- PostgreSQL (또는 Docker)

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
# .env 파일을 열어 값 입력

# 서버 실행
uvicorn app.main:app --reload
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 환경변수 (.env)

```env
DATABASE_URL=postgresql+asyncpg://유저:비밀번호@localhost:5432/persona_db
SECRET_KEY=랜덤한_시크릿_키_32자_이상
ACCESS_TOKEN_EXPIRE_MINUTES=30
GROQ_API_KEY=gsk_로_시작하는_Groq_API_키
DEBUG=True

# 소셜 로그인 (선택)
KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_REDIRECT_URI=http://localhost:8000/api/v1/auth/kakao/callback
GOOGLE_CLIENT_ID=구글_클라이언트_ID
GOOGLE_CLIENT_SECRET=구글_클라이언트_시크릿
```

> **Groq API 키**: [console.groq.com](https://console.groq.com) → 무료 회원가입 후 발급  
> **카카오 로그인**: [developers.kakao.com](https://developers.kakao.com) → 앱 생성 → REST API 키  
> **구글 로그인**: [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 클라이언트 ID

### Docker로 PostgreSQL 실행

```bash
docker run -d \
  --name persona-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=persona_db \
  -p 5432:5432 \
  postgres:15
```

### 관리자 계정 설정

```bash
docker exec -it persona-postgres psql -U postgres -d persona_db \
  -c "UPDATE users SET is_admin = true WHERE email = '이메일주소';"
```

## Docker Compose로 전체 스택 실행

```bash
# 환경변수 설정 (Groq API 키 등)
cp backend/.env.example backend/.env
# backend/.env 파일을 열어 GROQ_API_KEY 입력

# 빌드 및 실행 (DB + 백엔드 + 프론트엔드 전체)
docker compose up --build

# 백그라운드 실행
docker compose up -d --build
```

브라우저에서 `http://localhost` 접속

### 관리자 계정 설정 (Docker Compose)

```bash
docker compose exec db psql -U persona -d persona_db \
  -c "UPDATE users SET is_admin = true WHERE email = '이메일주소';"
```

## Railway 배포

Railway는 백엔드와 프론트엔드를 별도 서비스로 배포합니다.

### 1. 백엔드 배포

1. [Railway](https://railway.app) 프로젝트 생성
2. GitHub 저장소 연결 → **Root Directory**: `backend`
3. PostgreSQL 플러그인 추가 → `DATABASE_URL` 자동 설정됨
4. 환경변수 설정:
   - `SECRET_KEY` — 랜덤 시크릿 키
   - `GROQ_API_KEY` — Groq API 키
   - `ALLOWED_ORIGINS` — 프론트엔드 배포 URL
   - `DEBUG=False`

### 2. 프론트엔드 배포

1. Railway 새 서비스 추가 → **Root Directory**: `frontend`
2. 빌드 환경변수 설정:
   - `VITE_API_URL` — 백엔드 Railway URL + `/api/v1`
   - `VITE_WS_URL` — `wss://` + 백엔드 Railway 도메인 + `/api/v1`
   - `VITE_BACKEND_URL` — 백엔드 Railway URL
