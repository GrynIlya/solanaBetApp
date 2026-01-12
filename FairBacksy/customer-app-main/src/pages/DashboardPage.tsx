import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface UserInfo {
  sub: string
  email: string
  roles: {
    roles?: string[]
  } | null
}

interface ProfileInfo {
  keycloakUserId: string
  email: string
  fullName: string | null
  phone: string | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  // Используем отдельные селекторы для избежания проблем с persist
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const fetchUserInfo = async () => {
      try {
        // Получаем базовую информацию из JWT токена (роли)
        const meResponse = await api.get('/me')
        setUserInfo(meResponse.data)

        // Получаем полную информацию из базы данных (fullName, phone)
        try {
          const profileResponse = await api.get('/profile')
          setProfileInfo(profileResponse.data)
        } catch (profileErr: any) {
          // Если /profile не доступен (500 ошибка), продолжаем без него
          // Это не критично - основная информация есть в JWT токене
          if (import.meta.env.DEV) {
            console.warn('Profile endpoint not available:', {
              status: profileErr.response?.status,
              message: profileErr.message,
              data: profileErr.response?.data,
            })
          }
          // Не устанавливаем ошибку, так как это не критично
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout()
          navigate('/login')
        } else {
          setError('Error loading user data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [token, navigate, logout])

  const handleLogout = () => {
    // logout() очищает все токены и делает полный редирект на /login
    logout()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Отладочная информация
  if (import.meta.env.DEV) {
    console.log('DashboardPage render:', {
      loading,
      error,
      hasToken: !!token,
      hasUser: !!user,
      hasUserInfo: !!userInfo,
      hasProfileInfo: !!profileInfo,
    })
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">ID</Label>
              <p className="text-sm font-mono">{userInfo?.sub || user?.id || 'Loading...'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-sm">{profileInfo?.email || userInfo?.email || user?.email || 'Loading...'}</p>
            </div>
            {profileInfo?.fullName && (
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="text-sm">{profileInfo.fullName}</p>
              </div>
            )}
            {profileInfo?.phone && (
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                <p className="text-sm">{profileInfo.phone}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {userInfo?.roles && Array.isArray(userInfo.roles.roles) && userInfo.roles.roles.length > 0 ? (
                  userInfo.roles.roles
                    .filter((role) => {
                      // Filter out technical Keycloak roles
                      const technicalRoles = [
                        'offline_access',
                        'uma_authorization',
                        'default-roles-forms-realm',
                      ]
                      return !technicalRoles.includes(role)
                    })
                    .map((role, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md"
                      >
                        {role}
                      </span>
                    ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles</span>
                )}
              </div>
              {userInfo?.roles && Array.isArray(userInfo.roles.roles) && userInfo.roles.roles.some((role) =>
                ['offline_access', 'uma_authorization', 'default-roles-forms-realm'].includes(role)
              ) && (
                <p className="text-xs text-muted-foreground mt-2">
                  * Technical Keycloak roles are hidden
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

