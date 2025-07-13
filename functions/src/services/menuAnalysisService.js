const functions = require('firebase-functions')
const admin = require('firebase-admin')

// Genkit AI imports with graceful fallback
let gemini15Flash, googleAI, genkit
try {
  const genkitAI = require('@genkit-ai/ai')
  const genkitGoogle = require('@genkit-ai/googleai')
  gemini15Flash = genkitGoogle.gemini15Flash
  googleAI = genkitGoogle.googleAI
  genkit = genkitAI.genkit
} catch (error) {
  functions.logger.error('Failed to load Genkit modules in menuAnalysisService:', error.message)
}

// Initialize Genkit with Google AI - with error handling
let ai = null
try {
  if (genkit && googleAI && gemini15Flash) {
    ai = genkit({
      plugins: [googleAI()],
      model: gemini15Flash
    })
    functions.logger.info('Genkit AI initialized successfully in menuAnalysisService')
  } else {
    functions.logger.warn('Genkit modules not available, AI features disabled in menuAnalysisService')
  }
} catch (error) {
  functions.logger.error('Failed to initialize Genkit AI in menuAnalysisService:', error.message)
}

// Helper function to check if AI is available and healthy
const isAIAvailable = () => {
  return ai !== null && typeof ai.generate === 'function'
}

/**
 * Advanced menu analysis with structured insights
 * PRD requirement FR-3: Call Gemini Vision with function calling schema
 */
const analyzeMenuAdvanced = async (imageUrl, userPrefs) => {
  if (!isAIAvailable()) {
    throw new Error('AI service is not available')
  }

  try {
    const analysisPrompt = `
Analyze this menu image comprehensively. Extract detailed information for each dish and provide overall menu insights.

User preferences: ${userPrefs ? JSON.stringify(userPrefs) : 'none'}

Return a JSON object with this exact structure:
{
  "dishes": [
    {
      "name": "dish name",
      "description": "brief description",
      "calories": number,
      "macros": {
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number
      },
      "flags": {
        "diets": ["vegan", "keto", "gluten-free", etc.],
        "allergens": ["nuts", "dairy", "gluten", etc.]
      },
      "confidence": number (0-1),
      "price": "estimated price if visible",
      "category": "appetizer/main/dessert/drink"
    }
  ],
  "menuInsights": {
    "cuisineType": "type of cuisine",
    "priceRange": "budget/mid-range/upscale",
    "healthiness": number (1-10),
    "dietFriendly": ["vegan", "keto", etc.],
    "recommendations": [
      {
        "dish": "dish name",
        "reason": "why recommended for user prefs"
      }
    ]
  },
  "nutritionSummary": {
    "averageCalories": number,
    "healthiestOption": "dish name",
    "highestCalorie": "dish name",
    "bestForDiet": {
      "vegan": "dish name",
      "keto": "dish name",
      "low-calorie": "dish name"
    }
  }
}

Focus on accuracy and provide realistic nutrition estimates. Only include allergens that are likely present.
Rate confidence based on image clarity and text visibility.
`

    const { text: responseText } = await ai.generate([
      { media: { url: imageUrl } },
      { text: analysisPrompt }
    ])

    if (!responseText || !responseText.trim()) {
      throw new Error('Empty response from AI service')
    }

    // Clean and parse JSON response
    const cleanedResponse = responseText.replace(/```[a-z]*|```/g, '').trim()
    let analysisData

    try {
      analysisData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      functions.logger.error('Failed to parse advanced analysis JSON:', parseError)
      // Fallback to basic analysis
      return await analyzeMenuBasic(imageUrl, userPrefs)
    }

    // Validate and sanitize data
    const validatedData = {
      dishes: (analysisData.dishes || [])
        .filter(dish => dish && dish.name)
        .map(dish => ({
          name: dish.name || 'Unknown Dish',
          description: dish.description || '',
          calories: Math.max(0, Math.min(5000, dish.calories || 0)),
          macros: {
            protein: Math.max(0, Math.min(300, dish.macros?.protein || 0)),
            carbs: Math.max(0, Math.min(500, dish.macros?.carbs || 0)),
            fat: Math.max(0, Math.min(200, dish.macros?.fat || 0)),
            fiber: Math.max(0, Math.min(100, dish.macros?.fiber || 0))
          },
          flags: {
            diets: Array.isArray(dish.flags?.diets) ? dish.flags.diets : [],
            allergens: Array.isArray(dish.flags?.allergens) ? dish.flags.allergens : []
          },
          confidence: Math.max(0, Math.min(1, dish.confidence || 0.5)),
          price: dish.price || null,
          category: dish.category || 'main'
        })),
      menuInsights: analysisData.menuInsights || {},
      nutritionSummary: analysisData.nutritionSummary || {}
    }

    functions.logger.info('Advanced menu analysis completed', {
      dishesFound: validatedData.dishes.length,
      cuisineType: validatedData.menuInsights.cuisineType,
      averageConfidence: validatedData.dishes.reduce((acc, dish) => acc + dish.confidence, 0) / validatedData.dishes.length
    })

    return validatedData

  } catch (error) {
    functions.logger.error('Advanced menu analysis failed, falling back to basic:', error)
    // Graceful fallback to basic analysis
    return await analyzeMenuBasic(imageUrl, userPrefs)
  }
}

/**
 * Basic menu analysis - fallback when advanced analysis fails
 */
const analyzeMenuBasic = async (imageUrl, userPrefs) => {
  if (!isAIAvailable()) {
    throw new Error('AI service is not available')
  }

  const basicPrompt = `
Analyze this menu image and extract basic dish information.

Return a JSON array with this structure:
[
  {
    "name": "dish name",
    "calories": number,
    "macros": {
      "protein": number,
      "carbs": number,
      "fat": number
    },
    "flags": {
      "diets": ["vegan", "vegetarian", etc.],
      "allergens": ["nuts", "dairy", etc.]
    }
  }
]

Focus on main dishes. Make reasonable nutrition estimates.
`

  const { text: responseText } = await ai.generate([
    { media: { url: imageUrl } },
    { text: basicPrompt }
  ])

  // Parse basic response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in basic analysis response')
  }

  const dishes = JSON.parse(jsonMatch[0])
  
  return {
    dishes: dishes.map(dish => ({
      name: dish.name || 'Unknown Dish',
      calories: Math.max(0, dish.calories || 0),
      macros: {
        protein: Math.max(0, dish.macros?.protein || 0),
        carbs: Math.max(0, dish.macros?.carbs || 0),
        fat: Math.max(0, dish.macros?.fat || 0)
      },
      flags: {
        diets: Array.isArray(dish.flags?.diets) ? dish.flags.diets : [],
        allergens: Array.isArray(dish.flags?.allergens) ? dish.flags.allergens : []
      }
    }))
  }
}

/**
 * Apply user preferences to filter and enhance results
 * PRD requirement FR-5: Apply diet/allergen prefs before response
 */
const applyUserPreferences = (analysisResult, userPrefs) => {
  if (!userPrefs) return analysisResult

  const { diets, allergens } = userPrefs

  // Flag dishes that match user's dietary restrictions
  const enhancedDishes = analysisResult.dishes.map(dish => {
    const matchedDiets = diets ? dish.flags.diets.filter(diet => diets.includes(diet)) : []
    const flaggedAllergens = allergens ? dish.flags.allergens.filter(allergen => allergens.includes(allergen)) : []

    return {
      ...dish,
      userFlags: {
        matchesDiet: matchedDiets.length > 0,
        matchedDiets,
        hasAllergens: flaggedAllergens.length > 0,
        flaggedAllergens
      },
      recommendation: getRecommendationScore(dish, userPrefs)
    }
  })

  // Sort dishes by recommendation score if user has preferences
  if (diets || allergens) {
    enhancedDishes.sort((a, b) => (b.recommendation || 0) - (a.recommendation || 0))
  }

  return {
    ...analysisResult,
    dishes: enhancedDishes
  }
}

/**
 * Calculate recommendation score based on user preferences
 */
const getRecommendationScore = (dish, userPrefs) => {
  let score = 5 // Base score

  if (userPrefs.diets) {
    const matchedDiets = dish.flags.diets.filter(diet => userPrefs.diets.includes(diet))
    score += matchedDiets.length * 3 // Bonus for matching diets
  }

  if (userPrefs.allergens) {
    const hasAllergens = dish.flags.allergens.some(allergen => userPrefs.allergens.includes(allergen))
    if (hasAllergens) {
      score -= 5 // Penalty for allergens
    }
  }

  // Bonus for healthier options (lower calories, higher protein)
  if (dish.calories < 500) score += 1
  if (dish.macros.protein > 20) score += 1

  return Math.max(0, Math.min(10, score))
}

module.exports = {
  analyzeMenuAdvanced,
  analyzeMenuBasic,
  applyUserPreferences,
  isAIAvailable
}