import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MarketplacePage from './pages/MarketplacePage'
import LandingPage from './pages/LandingPage'
import CreatePersonaPage from './pages/CreatePersonaPage'
import MyPersonasPage from './pages/MyPersonasPage'
import EditPersonaPage from './pages/EditPersonaPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import PersonaDetailPage from './pages/PersonaDetailPage'
import ConversationsPage from './pages/ConversationsPage'
import AdminPage from './pages/AdminPage'
import PricingPage from './pages/PricingPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import FavoritesPage from './pages/FavoritesPage'
import CollectionsPage from './pages/CollectionsPage'
import CollectionDetailPage from './pages/CollectionDetailPage'
import NotFoundPage from './pages/NotFoundPage'

function HomeRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to="/marketplace" replace />
  return <LandingPage />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '0.5rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'dot-bounce 1.2s ease-in-out infinite' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'dot-bounce 1.2s ease-in-out 0.2s infinite' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'dot-bounce 1.2s ease-in-out 0.4s infinite' }} />
      <style>{`@keyframes dot-bounce { 0%,80%,100% { transform:scale(0.6); opacity:0.4 } 40% { transform:scale(1); opacity:1 } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation()
  // 로그인/회원가입 페이지에서는 Navbar 숨김
  const hideNavbar = ['/login', '/register'].includes(location.pathname)

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<PrivateRoute><CreatePersonaPage /></PrivateRoute>} />
        <Route path="/my" element={<PrivateRoute><MyPersonasPage /></PrivateRoute>} />
        <Route path="/edit/:personaId" element={<PrivateRoute><EditPersonaPage /></PrivateRoute>} />
        <Route path="/chat/:personaId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/persona/:personaId" element={<PersonaDetailPage />} />
        <Route path="/conversations" element={<PrivateRoute><ConversationsPage /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:collectionId" element={<CollectionDetailPage />} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
