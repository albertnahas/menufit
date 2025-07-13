import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadImage } from '../services/storage'
import { analyzeMenu } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleScan = async () => {
    if (!image || !user) return

    setLoading(true)
    setError('')

    try {
      const imageUrl = await uploadImage(image, user.uid)
      
      const allowedDiets = ['vegan', 'keto', 'vegetarian'] as const
      const allowedAllergens = ['gluten', 'nuts', 'dairy'] as const

      const filteredPrefs = {
        diets: user.preferences?.diets?.filter((diet: string): diet is typeof allowedDiets[number] =>
          allowedDiets.includes(diet as typeof allowedDiets[number])
        ),
        allergens: user.preferences?.allergens?.filter((allergen: string): allergen is typeof allowedAllergens[number] =>
          allowedAllergens.includes(allergen as typeof allowedAllergens[number])
        ),
      }

      const result = await analyzeMenu({
        imageUrl,
        userPrefs: filteredPrefs
      })

      navigate('/results', { state: { result, imageUrl } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze menu')
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setImage(null)
    setPreview(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan Menu</h1>
        <p className="text-gray-600">Take a photo or upload an image of your menu</p>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn btn-primary w-full py-4 text-lg"
          >
            📸 Take Photo
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary w-full py-4 text-lg"
          >
            📁 Upload from Gallery
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Menu preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleScan}
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Analyzing...' : 'Analyze Menu'}
            </button>
            
            <button
              onClick={resetScan}
              disabled={loading}
              className="btn btn-secondary w-full py-3"
            >
              Take Another Photo
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">This may take up to 10 seconds...</p>
        </div>
      )}
    </div>
  )
}