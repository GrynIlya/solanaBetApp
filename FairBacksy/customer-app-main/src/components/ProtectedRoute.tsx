import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Используем отдельные селекторы для избежания проблем с persist
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Простая проверка: если нет токена или не авторизован, редиректим на login
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


