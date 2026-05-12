import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind CSS 플러그인 추가
  ],
  server: {
    port: 5173,   // 프론트 개발 서버 포트
  },
})
