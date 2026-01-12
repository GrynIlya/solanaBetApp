import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CallbackPage } from './pages/CallbackPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Компонент для обработки OAuth параметров - должен быть внутри Router
function OAuthRedirectHandler() {
  const location = useLocation()

  useEffect(() => {
    // Если текущий маршрут не /callback и есть OAuth параметры, перенаправляем на /callback
    if (location.pathname !== '/callback') {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      const error = params.get('error')
      
      if (code || error) {
        if (import.meta.env.DEV) {
          console.log('🔄 OAuth parameters detected, redirecting to /callback...', { 
            pathname: location.pathname,
            code: !!code, 
            error 
          })
        }
        // Используем window.location для надежного редиректа (не зависит от Router контекста)
        const callbackUrl = `/callback?${params.toString()}`
        const currentUrl = window.location.pathname + window.location.search
        if (currentUrl !== callbackUrl) {
          window.location.replace(callbackUrl)
        }
      }
    }
  }, [location.pathname, location.search])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <OAuthRedirectHandler />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="callback" element={<CallbackPage />} />
          <Route
            path="dashboard"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
