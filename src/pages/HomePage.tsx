import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MenuScan AI</h1>
          <p className="text-lg text-gray-600">
            Get instant nutrition info from menu photos
          </p>
        </div>
        
        <div className="space-y-4">
          {user ? (
            <>
              <Link
                to="/scan"
                className="btn btn-primary w-full text-lg py-3 block"
              >
                Scan Menu
              </Link>
              <Link
                to="/history"
                className="btn btn-secondary w-full text-lg py-3 block"
              >
                View History
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary w-full text-lg py-3 block"
            >
              Get Started
            </Link>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Snap a photo • Get nutrition data • Make informed choices</p>
        </div>
      </div>
    </div>
  )
}