import { DishInfo } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface DishCardProps {
  dish: DishInfo
}

export default function DishCard({ dish }: DishCardProps) {
  const { user } = useAuth()

  const getDietChipColor = (diet: string) => {
    switch (diet.toLowerCase()) {
      case 'vegan':
        return 'bg-green-100 text-green-800'
      case 'vegetarian':
        return 'bg-green-100 text-green-800'
      case 'keto':
        return 'bg-purple-100 text-purple-800'
      case 'paleo':
        return 'bg-orange-100 text-orange-800'
      case 'gluten-free':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAllergenChipColor = (allergen: string) => {
    return 'bg-red-100 text-red-800'
  }

  const isUserAllergen = (allergen: string) => {
    return user?.preferences?.allergens?.includes(allergen.toLowerCase())
  }

  const isUserDiet = (diet: string) => {
    return user?.preferences?.diets?.includes(diet.toLowerCase())
  }

  const totalMacros = dish.macros.protein + dish.macros.carbs + dish.macros.fat
  const proteinPercentage = totalMacros > 0 ? (dish.macros.protein / totalMacros) * 100 : 0
  const carbsPercentage = totalMacros > 0 ? (dish.macros.carbs / totalMacros) * 100 : 0
  const fatPercentage = totalMacros > 0 ? (dish.macros.fat / totalMacros) * 100 : 0

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{dish.name}</h3>
        <span className="text-2xl font-bold text-primary-600">{dish.calories}</span>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <span>Protein: {dish.macros.protein}g</span>
          <span className="mx-2">•</span>
          <span>Carbs: {dish.macros.carbs}g</span>
          <span className="mx-2">•</span>
          <span>Fat: {dish.macros.fat}g</span>
        </div>
        
        <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
          <div
            className="bg-blue-500"
            style={{ width: `${proteinPercentage}%` }}
          />
          <div
            className="bg-green-500"
            style={{ width: `${carbsPercentage}%` }}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${fatPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {dish.flags.diets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.flags.diets.map((diet, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  getDietChipColor(diet)
                } ${
                  isUserDiet(diet) ? 'ring-2 ring-offset-1 ring-current' : ''
                }`}
              >
                {diet}
              </span>
            ))}
          </div>
        )}

        {dish.flags.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dish.flags.allergens.map((allergen, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  getAllergenChipColor(allergen)
                } ${
                  isUserAllergen(allergen) ? 'ring-2 ring-offset-1 ring-red-500' : ''
                }`}
              >
                ⚠️ Contains {allergen}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}