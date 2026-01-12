import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  expiresIn: number | null
  tokenExpiresAt: number | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken: string, expiresIn: number) => void
  setTokens: (token: string, refreshToken: string, expiresIn: number) => void
  logout: () => void
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresIn: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000
        localStorage.setItem('auth_token', token)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('token_expires_at', expiresAt.toString())
        set({ 
          user, 
          token, 
          refreshToken, 
          expiresIn,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true 
        })
      },
      setTokens: (token, refreshToken, expiresIn) => {
        const expiresAt = Date.now() + expiresIn * 1000
        localStorage.setItem('auth_token', token)
        localStorage.setItem('token_expires_at', expiresAt.toString())
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }
        set({ 
          token, 
          refreshToken, 
          expiresIn,
          tokenExpiresAt: expiresAt
        })
      },
      logout: () => {
        // Сначала очищаем состояние в store
        set({ 
          user: null, 
          token: null, 
          refreshToken: null,
          expiresIn: null,
          tokenExpiresAt: null,
          isAuthenticated: false 
        })
        
        // Затем очищаем все токены и данные из localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token_expires_at')
        localStorage.removeItem('code_verifier') // Очищаем PKCE verifier
        
        // Очищаем Zustand persist storage (важно делать это после set, чтобы не восстановилось)
        localStorage.removeItem('auth-storage')
        
        // Устанавливаем флаг, что был logout - это заставит показать форму входа при следующем логине
        sessionStorage.setItem('was_logout', 'true')
        
        // Используем window.location.href для полного сброса состояния приложения
        // Это гарантирует, что все компоненты перезагрузятся и состояние будет полностью очищено
        // Keycloak сессия будет очищена при следующем логине через prompt=login
        // Небольшая задержка гарантирует, что все очистки успеют выполниться
        setTimeout(() => {
          window.location.href = '/login'
        }, 50)
      },
      isTokenExpired: () => {
        const { tokenExpiresAt } = get()
        if (!tokenExpiresAt) return true
        return Date.now() >= tokenExpiresAt - 60000
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresIn: state.expiresIn,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.token !== null,
      }),
    }
  )
)
