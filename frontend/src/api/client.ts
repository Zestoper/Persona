import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 첫 접속 때 저장된 토큰이 만료돼 있으면 /auth/me 가 401을 돌려준다.
      // 이 확인 요청에서는 로그인 페이지로 보내지 않고 토큰만 지운 뒤 메인 화면에 머문다.
      const isSessionCheck = error.config?.url?.includes('/auth/me')
      if (!isSessionCheck && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
