import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateUserPreferences } from '../services/firestore'
import AIHealthCheck from '../components/AIHealthCheck'
import EmulatorStatus from '../components/EmulatorStatus'

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan', color: 'bg-green-100 text-green-800' },
  { value: 'vegetarian', label: 'Vegetarian', color: 'bg-green-100 text-green-800' },
  { value: 'keto', label: 'Keto', color: 'bg-purple-100 text-purple-800' },
  { value: 'paleo', label: 'Paleo', color: 'bg-orange-100 text-orange-800' },
  { value: 'gluten-free', label: 'Gluten-Free', color: 'bg-blue-100 text-blue-800' }
]

const ALLERGEN_OPTIONS = [
  { value: 'nuts', label: 'Nuts', color: 'bg-red-100 text-red-800' },
  { value: 'dairy', label: 'Dairy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'gluten', label: 'Gluten', color: 'bg-orange-100 text-orange-800' },
  { value: 'shellfish', label: 'Shellfish', color: 'bg-red-100 text-red-800' },
  { value: 'eggs', label: 'Eggs', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'soy', label: 'Soy', color: 'bg-green-100 text-green-800' }
]

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [diets, setDiets] = useState<string[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.preferences) {
      setDiets(user.preferences.diets || [])
      setAllergens(user.preferences.allergens || [])
    }
  }, [user])

  const toggleDiet = (diet: string) => {
    setDiets(prev => 
      prev.includes(diet) 
        ? prev.filter(d => d !== diet)
        : [...prev, diet]
    )
  }

  const toggleAllergen = (allergen: string) => {
    setAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    )
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setSaved(false)

    try {
      const preferences = { diets, allergens }
      await updateUserPreferences(user.uid, preferences)
      await updateUser({ ...user, preferences })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Customize your dietary preferences and allergen alerts
        </p>
      </div>

      <div className="space-y-8">
        {import.meta.env.DEV && <EmulatorStatus />}
        
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dietary Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select diets you follow. Matching dishes will be highlighted in results.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(diet => (
              <button
                key={diet.value}
                onClick={() => toggleDiet(diet.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  diets.includes(diet.value)
                    ? diet.color + ' ring-2 ring-offset-1 ring-current'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {diet.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Allergen Alerts</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select allergens you want to avoid. Dishes containing these will be clearly marked.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map(allergen => (
              <button
                key={allergen.value}
                onClick={() => toggleAllergen(allergen.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  allergens.includes(allergen.value)
                    ? allergen.color + ' ring-2 ring-offset-1 ring-red-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {allergen.label}
              </button>
            ))}
          </div>
        </div>

        <AIHealthCheck />

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            {user?.displayName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {user.displayName}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn w-full py-3 ${
            saved ? 'btn-secondary' : 'btn-primary'
          }`}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}