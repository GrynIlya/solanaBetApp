import { useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { initiateLogin } from '@/lib/pkce'

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()


  const handleLogout = () => {
    // logout() очищает все токены и делает полный редирект на /login
    logout()
  }

  const handleLogin = async () => {
    try {
      // Всегда принудительно показываем форму входа
      const wasLogout = sessionStorage.getItem('was_logout') === 'true'
      if (wasLogout) {
        sessionStorage.removeItem('was_logout')
      }
      
      // Всегда используем forceLogin=true, чтобы принудительно показывать форму входа
      await initiateLogin(undefined, true)
    } catch (error) {
      console.error('Failed to initiate login:', error)
    }
  }

  const handleRegister = () => {
    // Регистрация идет через форму, а не через OAuth
    navigate('/register')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Customer App
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost">About</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleLogin}>
                  Login
                </Button>
                <Button onClick={handleRegister}>
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Customer App. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
