import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ParticleOrbitLogo } from '@/components/ParticleOrbitLogo'
import { Button } from '@/components/ui/button'
import { initiateLogin, KEYCLOAK_CONFIG } from '@/lib/pkce'

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Проверяем доступность Keycloak перед редиректом
      const keycloakHealthUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/.well-known/openid-configuration`
      
      if (import.meta.env.DEV) {
        console.log('🔍 Checking Keycloak availability...', keycloakHealthUrl)
      }
      
      try {
        await fetch(keycloakHealthUrl, { 
          method: 'HEAD',
          mode: 'no-cors', // Используем no-cors, чтобы избежать CORS проблем
        })
        
        // В no-cors режиме мы не можем проверить статус, но если запрос не упал, значит сервер доступен
        if (import.meta.env.DEV) {
          console.log('✅ Keycloak appears to be available')
        }
      } catch (healthErr) {
        // Игнорируем ошибки проверки, так как no-cors может их вызывать
        if (import.meta.env.DEV) {
          console.warn('⚠️ Keycloak health check inconclusive:', healthErr)
        }
      }
      
      // Всегда принудительно показываем форму входа, чтобы пользователь всегда вводил пароль
      // Это гарантирует, что после логаута пользователь не будет автоматически залогинен
      const wasLogout = sessionStorage.getItem('was_logout') === 'true'
      if (wasLogout) {
        sessionStorage.removeItem('was_logout')
      }
      
      // Всегда используем forceLogin=true, чтобы принудительно показывать форму входа
      // Это предотвращает автоматический логин, если у пользователя есть активная сессия в Keycloak
      await initiateLogin(undefined, true)
      // initiateLogin делает window.location.href, поэтому код после этого не выполнится
    } catch (error: any) {
      console.error('❌ Failed to initiate login:', error)
      setError('Не удалось подключиться к серверу авторизации. Проверьте, что все сервисы запущены.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 py-12 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4">
          <ParticleOrbitLogo variant="color" size={240} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Sign In'}
        </Button>

        {/* Register Link */}
        <Link
          to="/register"
          className="mt-6 text-gray-600 hover:text-gray-800 underline text-sm"
        >
          Don't have an account? Create Account
        </Link>
      </div>
    </div>
  )
}
