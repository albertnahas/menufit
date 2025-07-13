import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AnalyzeMenuResponse } from '../types'
import DishCard from '../components/DishCard'
import { saveScan } from '../services/firestore'
import { useAuth } from '../contexts/AuthContext'

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { result, imageUrl } = location.state as {
    result: AnalyzeMenuResponse
    imageUrl: string
  }

  if (!result) {
    navigate('/scan')
    return null
  }

  const handleSave = async () => {
    if (!user || saving || saved) return

    setSaving(true)
    try {
      await saveScan({
        userId: user.uid,
        imageUrl,
        dishes: result.dishes,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setSaved(true)
    } catch (error) {
      console.error('Failed to save scan:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Analysis</h1>
        <p className="text-gray-600">
          Found {result.dishes.length} dishes • Processed in {result.processingTimeMs}ms
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {result.dishes.map((dish, index) => (
          <DishCard key={index} dish={dish} />
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`btn w-full py-3 ${
            saved ? 'btn-secondary' : 'btn-primary'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Scan'}
        </button>

        <button
          onClick={() => navigate('/scan')}
          className="btn btn-secondary w-full py-3"
        >
          Scan Another Menu
        </button>

        <button
          onClick={() => navigate('/history')}
          className="btn btn-secondary w-full py-3"
        >
          View History
        </button>
      </div>
    </div>
  )
}