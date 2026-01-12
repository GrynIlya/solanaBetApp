import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'
import { ParticleOrbitLogo } from '@/components/ParticleOrbitLogo'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)
  const isProcessingRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    const handleCallback = async () => {
      // Предотвращаем повторную обработку (React StrictMode вызывает useEffect дважды в dev)
      if (isProcessingRef.current) {
        if (import.meta.env.DEV) {
          console.log('⏸️ Callback already processing, skipping...')
        }
        return
      }
      isProcessingRef.current = true
      
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (import.meta.env.DEV) {
        console.log('🔍 CallbackPage: Processing callback', { code: code ? 'present' : 'missing', errorParam })
      }

      // Check for error from Keycloak
      if (errorParam) {
        if (import.meta.env.DEV) {
          console.error('❌ Keycloak error:', errorParam)
        }
        if (isMountedRef.current) {
          setError(`Authorization error: ${errorParam}`)
        }
        isProcessingRef.current = false
        return
      }

      // Check if code is present
      // If user navigated back from Keycloak, redirect to login instead of showing error
      if (!code) {
        if (import.meta.env.DEV) {
          console.log('⚠️ No authorization code found. User may have navigated back. Redirecting to login...')
        }
        // Clean up any leftover state
        localStorage.removeItem('code_verifier')
        isProcessingRef.current = false
        navigate('/login', { replace: true })
        return
      }

      // Get code verifier from localStorage
      const verifier = localStorage.getItem('code_verifier')
      if (!verifier) {
        if (import.meta.env.DEV) {
          console.error('❌ Code verifier not found in localStorage')
        }
        if (isMountedRef.current) {
          setError('Code verifier not found. Please try logging in again.')
        }
        isProcessingRef.current = false
        return
      }

      try {
        if (import.meta.env.DEV) {
          console.log('🔄 Exchanging authorization code for tokens...', { code: code.substring(0, 10) + '...', verifier: verifier.substring(0, 10) + '...' })
        }

        // Exchange code for tokens via backend
        // Бэкенд использует свой redirect_uri из конфига
        const response = await api.post('/public/api/exchange-code', {
          code,
          codeVerifier: verifier,
        })

        if (import.meta.env.DEV) {
          console.log('✅ Exchange-code response received:', { 
            hasData: !!response.data,
            keys: response.data ? Object.keys(response.data) : []
          })
        }

        const { accessToken, refreshToken, expiresIn } = response.data

        if (!accessToken) {
          throw new Error('Access token not received from server')
        }

        if (import.meta.env.DEV) {
          console.log('✅ Token exchange successful', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            expiresIn,
          })
        }

        // Save token to localStorage (for api interceptor)
        localStorage.setItem('auth_token', accessToken)
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }

        if (import.meta.env.DEV) {
          console.log('🔄 Fetching user information from /me endpoint...')
        }

        // Get user information
        const meResponse = await api.get('/me')
        const userData = meResponse.data

        if (import.meta.env.DEV) {
          console.log('✅ User data received:', { 
            sub: userData?.sub,
            email: userData?.email,
            hasRoles: !!userData?.roles
          })
        }

        // Save to auth store
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

        // Clean up immediately to prevent reuse
        localStorage.removeItem('code_verifier')
        isProcessingRef.current = false

        if (import.meta.env.DEV) {
          console.log('✅ Auth setup complete, redirecting to dashboard...')
        }

        // Redirect to dashboard
        navigate('/dashboard', { replace: true })
      } catch (err: any) {
        isProcessingRef.current = false
        console.error('❌ Token exchange failed:', err)
        console.error('❌ Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          stack: err.stack,
        })
        
        let errorMessage = 'Failed to complete authentication. Please try again.'
        if (err.response?.data) {
          const errorData = err.response.data
          if (errorData.error_description) {
            errorMessage = errorData.error_description
          } else if (errorData.error) {
            errorMessage = `Authentication error: ${errorData.error}`
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } else if (err.message) {
          errorMessage = err.message
        }
        
        if (isMountedRef.current) {
          setError(errorMessage)
        }
        localStorage.removeItem('code_verifier')
      }
    }

    handleCallback()
    
    return () => {
      isMountedRef.current = false
    }
  }, [searchParams, navigate, setAuth])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 py-12 flex flex-col items-center">
          <div className="mb-8">
            <ParticleOrbitLogo variant="color" size={200} />
          </div>
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl font-semibold">Authentication Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 py-12 flex flex-col items-center">
        <div className="mb-8">
          <ParticleOrbitLogo variant="color" size={200} />
        </div>
        <div className="text-center space-y-4">
          <div className="text-lg font-semibold text-gray-900">Completing authentication...</div>
          <p className="text-gray-600">Please wait while we sign you in</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

