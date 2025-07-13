import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserScans } from '../services/firestore'
import { MenuScan } from '../types'
import { Link } from 'react-router-dom'

export default function HistoryPage() {
  const { user } = useAuth()
  const [scans, setScans] = useState<MenuScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadScans()
    }
  }, [user])

  const loadScans = async () => {
    if (!user) return

    try {
      const userScans = await getUserScans(user.uid)
      setScans(userScans)
    } catch (error) {
      console.error('Failed to load scans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading your scans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan History</h1>
        <p className="text-gray-600">
          View and manage your previous menu scans
        </p>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No scans yet</h2>
          <p className="text-gray-600 mb-6">
            Start by scanning your first menu to see results here
          </p>
          <Link
            to="/scan"
            className="btn btn-primary"
          >
            Scan Your First Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <div key={scan.id} className="card">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={scan.imageUrl}
                    alt="Menu scan"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {scan.dishes.length} dishes found
                    </p>
                    <p className="text-xs text-gray-500">
                      {scan.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {scan.dishes.slice(0, 3).map((dish, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {dish.name}
                        </span>
                      ))}
                      {scan.dishes.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{scan.dishes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}