import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-xl font-bold text-primary-600">
                MenuScan AI
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link
                  to="/scan"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/scan')
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Scan
                </Link>
                <Link
                  to="/history"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/history')
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  History
                </Link>
                <Link
                  to="/settings"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/settings')
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className={user ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  )
}