import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../services/firebase'

export default function EmulatorStatus() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testEmulator = async () => {
    setLoading(true)
    setStatus('Testing emulator connection...')
    
    try {
      // Test the checkAIHealth function
      const checkAIHealth = httpsCallable(functions, 'checkAIHealth')
      const result = await checkAIHealth()
      
      setStatus(`✅ Emulator connected! Response: ${JSON.stringify(result.data, null, 2)}`)
    } catch (error: any) {
      console.error('Emulator test failed:', error)
      setStatus(`❌ Emulator test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testAnalyzeMenu = async () => {
    setLoading(true)
    setStatus('Testing analyzeMenu function...')
    
    try {
      const analyzeMenu = httpsCallable(functions, 'analyzeMenu')
      const result = await analyzeMenu({
        imageUrl: 'https://example.com/test.jpg',
        prefs: { diets: ['vegan'], allergens: ['nuts'] }
      })
      
      setStatus(`✅ analyzeMenu works! Response: ${JSON.stringify(result.data, null, 2)}`)
    } catch (error: any) {
      console.error('analyzeMenu test failed:', error)
      setStatus(`❌ analyzeMenu test failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">🔧 Functions Emulator Test</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testEmulator}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
        >
          {loading ? 'Testing...' : 'Test Health Check'}
        </button>
        
        <button
          onClick={testAnalyzeMenu}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Analyze Menu'}
        </button>
      </div>

      {status && (
        <div className="bg-white p-3 rounded border">
          <pre className="text-sm whitespace-pre-wrap">{status}</pre>
        </div>
      )}

      <div className="text-sm text-blue-700 mt-2">
        <p>🔧 Emulator should be running at: http://127.0.0.1:5002</p>
        <p>📊 Emulator UI: http://127.0.0.1:4002</p>
      </div>
    </div>
  )
}