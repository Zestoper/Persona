// ── Axios 인스턴스 생성 ────────────────────────────────────
// 비유: 우체국 창구 하나를 예약해두는 것.
//       매번 주소, 인증 정보를 새로 입력하지 않아도 자동으로 붙여줌.
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // 모든 요청 앞에 자동으로 붙는 주소
  headers: {
    'Content-Type': 'application/json',    // JSON 형식으로 데이터를 보냄
  },
})

// ── 요청 인터셉터 ─────────────────────────────────────────
// 비유: 편지를 보내기 직전에 항상 신분증을 봉투에 자동으로 넣어주는 직원
// 모든 요청마다 localStorage에서 토큰을 꺼내서 헤더에 자동으로 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') // 로그인 때 저장한 JWT 토큰
  if (token) {
    config.headers.Authorization = `Bearer ${token}` // "Bearer 토큰값" 형식으로 추가
  }
  return config // 수정된 요청 설정 반환
})

// ── 응답 인터셉터 ─────────────────────────────────────────
// 401 에러(토큰 만료)가 오면 자동으로 로그아웃 처리
api.interceptors.response.use(
  (response) => response, // 정상 응답은 그대로 통과
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token') // 만료된 토큰 삭제
      window.location.href = '/login'  // 로그인 페이지로 이동
    }
    return Promise.reject(error) // 에러를 다시 위로 던짐
  }
)

export default api
