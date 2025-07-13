export interface DishFlags {
  diets: string[]
  allergens: string[]
}

export interface DishInfo {
  name: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  flags: DishFlags
}

export interface AnalyzeMenuRequest {
  imageUrl: string
  userPrefs?: {
    diets?: ('vegan' | 'keto' | 'vegetarian')[]
    allergens?: ('gluten' | 'nuts' | 'dairy')[]
  }
}

export interface AnalyzeMenuResponse {
  dishes: DishInfo[]
  model: 'gemini-1.5-flash'
  processingTimeMs: number
}

export interface MenuScan {
  id: string
  userId: string
  imageUrl: string
  dishes: DishInfo[]
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  diets: string[]
  allergens: string[]
}

export interface User {
  uid: string
  email: string
  displayName?: string
  preferences: UserPreferences
}