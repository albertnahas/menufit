const cors = require('cors')({ origin: true })
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

// Genkit AI imports with graceful fallback
let gemini15Flash, googleAI, genkit
try {
  const genkitGoogle = require('@genkit-ai/googleai')
  const genkitCore = require('genkit')
  gemini15Flash = genkitGoogle.gemini15Flash
  googleAI = genkitGoogle.googleAI
  genkit = genkitCore.genkit
  functions.logger.info('Genkit modules loaded successfully')
} catch (error) {
  functions.logger.error('Failed to load Genkit modules:', error.message)
  // AI features will be disabled but the app will continue to work
}

admin.initializeApp()

// Initialize Genkit with Google AI - with error handling
let ai = null
try {
  if (genkit && googleAI && gemini15Flash) {
    ai = genkit({
      plugins: [googleAI()],
      model: gemini15Flash
    })
    functions.logger.info('Genkit AI initialized successfully')
  } else {
    functions.logger.warn('Genkit modules not available, AI features disabled')
  }
} catch (error) {
  functions.logger.error('Failed to initialize Genkit AI:', error.message)
  // AI features will be disabled but the app will continue to work
}

// PRD requirement FR-1, FR-2: Main analyzeMenu function
exports.analyzeMenu = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
    maxInstances: 40
  })
  .https.onCall(async (data, context) => {
    const startTime = Date.now()
    try {

      // PRD requirement FR-2: Accept data with imageUrl + userPrefs
      const { imageUrl, userPrefs } = data

      if (!imageUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Image URL is required')
      }

      // Validate Firebase Storage URL (PRD requirement)
      if (!imageUrl.includes('firebasestorage.googleapis.com')) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid image URL - must be from Firebase Storage')
      }

      functions.logger.info('Processing menu analysis request', {
        imageUrl: imageUrl.substring(0, 50) + '...',
        userPrefs
      })


      // PRD requirement FR-3: Call Gemini Vision with function calling schema
      const dishes = await processMenuWithGemini(imageUrl, userPrefs)

      // PRD requirement FR-6: Delete image from Storage after analysis (GDPR)
      await deleteImageAfterProcessing(imageUrl)

      const processingMs = Date.now() - startTime

      // PRD requirement FR-7: Log metrics
      await logMetrics({
        functionName: 'analyzeMenu',
        executionTime: processingMs,
        tokensUsed: dishes.tokensUsed || 0,
        costEstimate: dishes.costEstimate || 0,
        success: true,
        timestamp: new Date()
      })

      const response = {
        dishes: dishes.dishes || dishes,
        model: 'gemini-1.5-flash',
        processingMs
      }

      functions.logger.info('Menu analysis completed', {
        processingMs,
        dishCount: response.dishes.length
      })

      return response

    } catch (error) {
      const processingMs = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'
      
      functions.logger.error('Menu analysis failed', {
        error: errorMessage,
        processingMs
      })

      // Log error metrics
      await logMetrics({
        functionName: 'analyzeMenu',
        executionTime: processingMs,
        tokensUsed: 0,
        costEstimate: 0,
        success: false,
        error: errorMessage,
        timestamp: new Date()
      })

      // Re-throw as HttpsError if not already one
      if (error instanceof functions.https.HttpsError) {
        throw error
      }
      
      throw new functions.https.HttpsError('internal', 'Failed to analyze menu')
    }
  })

// Process menu with Gemini AI using Genkit (PRD requirement FR-3)
const processMenuWithGemini = async (imageUrl, userPrefs) => {
  
  try {
    // Create structured prompt for menu analysis
    const menuAnalysisPrompt = `
Analyze this menu image and extract dish information. For each dish, provide:
1. Name (string)
2. Estimated calories (number)
3. Macronutrients in grams: protein, carbs, fat (numbers)
4. Diet flags: vegan, vegetarian, keto, gluten-free, etc. (array of strings)
5. Allergen warnings: nuts, dairy, gluten, shellfish, eggs, soy (array of strings)

User preferences: ${userPrefs ? JSON.stringify(userPrefs) : 'none'}

Focus on main dishes and entrees. Skip drinks, sides, and desserts unless they are clearly featured.
Make reasonable estimates for nutrition based on typical portions and ingredients.
Only include allergens that are likely present based on typical preparation methods.

Return the data as a JSON array with this exact structure:
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
      "diets": ["vegan", "keto", etc.],
      "allergens": ["nuts", "dairy", etc.]
    }
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text or formatting.
`

    // Call Genkit AI with image URL and prompt
    const ai = genkit({
      plugins: [googleAI()],
      model: gemini15Flash
    })

    const { text: responseText } = await ai.generate([
      { media: { url: imageUrl } },
      { text: menuAnalysisPrompt }
    ])

    if (!responseText || !responseText.trim()) {
      throw new Error('Empty response from AI service')
    }

    // Parse JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      functions.logger.error('No valid JSON found in AI response:', responseText)
      throw new Error('Invalid response format from AI service')
    }

    let dishes
    try {
      dishes = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      functions.logger.error('Failed to parse AI response JSON:', parseError)
      throw new Error('Failed to parse AI response')
    }

    // Validate and sanitize dishes
    const validatedDishes = dishes
      .filter(dish => dish && dish.name)
      .map(dish => ({
        name: dish.name || 'Unknown Dish',
        calories: Math.max(0, Math.min(5000, dish.calories || 0)), // Reasonable calorie range
        macros: {
          protein: Math.max(0, Math.min(300, dish.macros?.protein || 0)),
          carbs: Math.max(0, Math.min(500, dish.macros?.carbs || 0)),
          fat: Math.max(0, Math.min(200, dish.macros?.fat || 0))
        },
        flags: {
          diets: Array.isArray(dish.flags?.diets) ? dish.flags.diets : [],
          allergens: Array.isArray(dish.flags?.allergens) ? dish.flags.allergens : []
        }
      }))

    functions.logger.info('Menu analysis completed', {
      dishesFound: validatedDishes.length
    })

    return {
      dishes: validatedDishes,
      tokensUsed: 0, // Will be updated when we get token usage from response
      costEstimate: 0 // Will be calculated based on tokens
    }

  } catch (error) {
    functions.logger.error('Error processing menu with Genkit AI:', error)
    
    // Provide specific error messages based on error type
    if (error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    } else if (error.message.includes('unauthorized')) {
      throw new Error('API access denied. Please check configuration.')
    } else if (error.message.includes('timeout')) {
      throw new Error('AI service timeout. Please try again.')
    }
    
    throw new Error('Failed to process menu with AI service')
  }
}

// PRD requirement FR-6: Delete image from Storage after analysis (GDPR compliance)
const deleteImageAfterProcessing = async (imageUrl) => {
  try {
    // Extract file path from Firebase Storage URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1].split('?')[0] // Remove query params
    
    // Delete from Firebase Storage
    await admin.storage().bucket().file(fileName).delete()
    
    functions.logger.info('Image deleted successfully for GDPR compliance', { fileName })
  } catch (error) {
    // Log but don't fail the function - image deletion is best effort
    functions.logger.warn('Failed to delete image (GDPR):', error.message)
  }
}

// PRD requirement FR-7: Log metrics for monitoring and cost tracking
const logMetrics = async (metrics) => {
  try {
    // Structure for Cloud Logging -> BigQuery export
    const logData = {
      timestamp: metrics.timestamp.toISOString(),
      function_name: metrics.functionName,
      execution_time_ms: metrics.executionTime,
      tokens_used: metrics.tokensUsed,
      cost_estimate_eur: metrics.costEstimate,
      success: metrics.success,
      error: metrics.error || null,
      // Additional fields for cost monitoring
      cost_per_token: metrics.tokensUsed > 0 ? metrics.costEstimate / metrics.tokensUsed : 0,
      performance_grade: getPerformanceGrade(metrics.executionTime)
    }

    // Log structured data for BigQuery export
    functions.logger.info('function_metrics', logData)

    // Log cost alert if over threshold (PRD requirement: €0.045 per 1000 scans)
    if (metrics.costEstimate > 0.000045) { // €0.045 / 1000
      functions.logger.warn('High cost per scan detected', {
        cost_eur: metrics.costEstimate,
        threshold_eur: 0.000045,
        function_name: metrics.functionName
      })
    }

    // Log performance alert if over P95 target (PRD requirement: ≤ 8s)
    if (metrics.executionTime > 8000) {
      functions.logger.warn('High latency detected', {
        execution_time_ms: metrics.executionTime,
        threshold_ms: 8000,
        function_name: metrics.functionName
      })
    }
  } catch (error) {
    functions.logger.error('Failed to log metrics', {
      error: error.message,
      metrics
    })
  }
}

// Get performance grade based on execution time
const getPerformanceGrade = (executionTimeMs) => {
  if (executionTimeMs <= 3000) return 'excellent'
  if (executionTimeMs <= 5000) return 'good'
  if (executionTimeMs <= 8000) return 'acceptable'
  return 'poor'
}

// AI Health Check Function (mirrors the pattern from example)
exports.checkAIHealth = functions.https.onCall(async () => {
  try {
    const status = {
      genkitLoaded: !!(genkit && googleAI && gemini15Flash),
      aiInitialized: ai !== null,
      timestamp: new Date().toISOString()
    }

    functions.logger.info('AI Health Check:', status)
    return status
  } catch (error) {
    functions.logger.error('AI Health Check failed:', error.message)
    return {
      aiAvailable: false,
      genkitLoaded: false,
      aiInitialized: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})

// Future function - PRD nice-to-have
exports.feedbackCorrection = functions
  .runWith({
    timeoutSeconds: 30,
    memory: '512MB'
  })
  .https.onCall(async (data, context) => {
    // Verify user authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
    }

    // Placeholder for future implementation
    throw new functions.https.HttpsError('unimplemented', 'Feedback correction not yet implemented')
  })