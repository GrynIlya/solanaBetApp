import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ParticleOrbitLogo } from '@/components/ParticleOrbitLogo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Регистрация через API (OAuth 2.0 не поддерживает регистрацию)
      await api.post('/public/api/register', {
        email,
        password,
        fullName: name || undefined,
      })

      // После успешной регистрации автоматически логиним через ROPC (Resource Owner Password Credentials)
      // Это безопаснее, чем OAuth flow, так как у нас уже есть пароль
      if (import.meta.env.DEV) {
        console.log('✅ Registration successful, waiting before auto-login...')
      }
      
      // Увеличиваем задержку, чтобы Keycloak успел полностью обработать регистрацию
      // Keycloak может требовать время для синхронизации пользователя
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      try {
        if (import.meta.env.DEV) {
          console.log('🔄 Attempting auto-login...')
        }
        
        // Используем прямой axios запрос, чтобы обойти interceptor при ошибке
        const loginResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/public/api/login`, {
          email,
          password,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const { accessToken, refreshToken, expiresIn } = loginResponse.data

        if (import.meta.env.DEV) {
          console.log('✅ Auto-login successful, setting up auth...')
        }

        // Сохраняем токены
        localStorage.setItem('auth_token', accessToken)
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }

        // Теперь используем api с токеном для получения информации о пользователе
        const meResponse = await api.get('/me')
        const userData = meResponse.data

        // Сохраняем в store
        setAuth(
          {
            id: userData.sub,
            email: userData.email,
            name: userData.email.split('@')[0],
          },
          accessToken,
          refreshToken || '',
          expiresIn || 300
        )

        if (import.meta.env.DEV) {
          console.log('✅ Auth setup complete, redirecting to dashboard...')
        }

        // Редирект на dashboard
        navigate('/dashboard', { replace: true })
      } catch (loginErr: any) {
        // Если автоматический логин не удался, показываем ошибку
        console.error('❌ Auto-login failed:', loginErr)
        console.error('❌ Error details:', {
          status: loginErr.response?.status,
          statusText: loginErr.response?.statusText,
          data: loginErr.response?.data,
          message: loginErr.message,
        })
        
        let errorMessage = 'Registration successful, but auto-login failed. Please login manually.'
        if (loginErr.response?.data) {
          const errorData = loginErr.response.data
          if (errorData.error_description) {
            errorMessage = `Registration successful, but auto-login failed: ${errorData.error_description}`
          } else if (errorData.error) {
            errorMessage = `Registration successful, but auto-login failed: ${errorData.error}`
          } else if (errorData.message) {
            errorMessage = `Registration successful, but auto-login failed: ${errorData.message}`
          }
        } else if (loginErr.message) {
          errorMessage = `Registration successful, but auto-login failed: ${loginErr.message}`
        }
        
        setError(errorMessage)
        setLoading(false)
        
        // НЕ делаем автоматический редирект - пусть пользователь увидит ошибку и сам решит, что делать
        // Если нужно, можно добавить кнопку "Go to Login"
      }
    } catch (err: any) {
      let errorMessage = 'Registration error. Please try again.'
      
      if (err.response?.data) {
        if (err.response.status === 409) {
          errorMessage = 'Email already registered'
        } else {
          errorMessage = err.response.data.error || 
                        err.response.data.message || 
                        errorMessage
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 py-12 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <ParticleOrbitLogo variant="color" size={240} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <Input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 placeholder:text-gray-400"
            disabled={loading}
          />

          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 placeholder:text-gray-400"
            required
            disabled={loading}
          />

          <Input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 placeholder:text-gray-400"
            required
            minLength={6}
            disabled={loading}
          />

          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl border-gray-200 bg-gray-50/50 placeholder:text-gray-400"
            required
            minLength={6}
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-6"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </Button>
        </form>

        {/* Toggle Link */}
        {!error && (
          <Link
            to="/login"
            className="mt-6 text-gray-600 hover:text-gray-800 underline text-sm"
          >
            Already have an account? Sign In
          </Link>
        )}
        
        {/* Go to Login button if auto-login failed */}
        {error && error.includes('auto-login failed') && (
          <Link
            to="/login"
            className="mt-4"
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login Page
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

