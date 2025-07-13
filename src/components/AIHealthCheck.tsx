import { useState } from 'react'
import { checkAIHealth } from '../services/api'

interface AIHealthStatus {
  aiAvailable: boolean
  genkitLoaded: boolean
  aiInitialized: boolean
  timestamp: string
  error?: string
}

export default function AIHealthCheck() {
  const [status, setStatus] = useState<AIHealthStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const handleHealthCheck = async () => {
    setLoading(true)
    try {
      const result = await checkAIHealth()
      setStatus(result as AIHealthStatus)
    } catch (error) {
      console.error('Health check failed:', error)
      setStatus({
        aiAvailable: false,
        genkitLoaded: false,
        aiInitialized: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (available: boolean) => {
    return available ? '✅' : '❌'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Service Health</h3>
        <button
          onClick={handleHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {status && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="font-medium">AI Available</span>
            <span className={`flex items-center gap-2 ${getStatusColor(status.aiAvailable)}`}>
              {getStatusIcon(status.aiAvailable)}
              {status.aiAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="font-medium">Genkit Loaded</span>
            <span className={`flex items-center gap-2 ${getStatusColor(status.genkitLoaded)}`}>
              {getStatusIcon(status.genkitLoaded)}
              {status.genkitLoaded ? 'Loaded' : 'Not Loaded'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="font-medium">AI Initialized</span>
            <span className={`flex items-center gap-2 ${getStatusColor(status.aiInitialized)}`}>
              {getStatusIcon(status.aiInitialized)}
              {status.aiInitialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="font-medium">Last Check</span>
            <span className="text-gray-600 text-sm">
              {new Date(status.timestamp).toLocaleString()}
            </span>
          </div>

          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {status.error}
              </p>
            </div>
          )}

          {status.aiAvailable && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                ✅ Functions are ready! Menu analysis should work properly.
              </p>
            </div>
          )}
        </div>
      )}

      {!status && (
        <div className="text-center py-8 text-gray-500">
          Click "Check Status" to test the AI service connection
        </div>
      )}
    </div>
  )
}