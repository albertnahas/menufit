import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { AnalyzeMenuRequest, AnalyzeMenuResponse } from '../types'

// Firebase Functions callable references
const analyzeMenuFunction = httpsCallable(functions, 'analyzeMenu')
const checkAIHealthFunction = httpsCallable(functions, 'checkAIHealth')

export const analyzeMenu = async (request: AnalyzeMenuRequest): Promise<AnalyzeMenuResponse> => {
  // Always use Firebase Functions (emulator in dev, production in prod)
  console.log('Environment:', import.meta.env.DEV ? 'Development (Emulator)' : 'Production')

  try {
    console.log('Calling Firebase Function: analyzeMenu', request)
    const result = await analyzeMenuFunction(request)
    const response = result.data as AnalyzeMenuResponse
    
    // Add model field if not present (for backwards compatibility)
    if (!response.model) {
      response.model = 'gemini-1.5-flash'
    }
    
    return response
  } catch (error: any) {
    console.error('Error analyzing menu:', error)
    
    // Handle Firebase Functions specific errors
    if (error.code === 'functions/unavailable') {
      throw new Error('AI service is currently unavailable. Please try again later.')
    }
    if (error.code === 'functions/deadline-exceeded') {
      throw new Error('Request timeout. Please try again with a smaller image.')
    }
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('Too many requests. Please try again later.')
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error('Access denied. Please check your authentication.')
    }
    if (error.code === 'functions/invalid-argument') {
      throw new Error('Invalid request. Please check your image URL.')
    }
    
    // Fallback to mock if function fails in development
    if (import.meta.env.DEV) {
      console.warn('Function failed, falling back to mock data')
      return mockAnalyzeMenu(request)
    }
    
    throw new Error(error.message || 'Failed to analyze menu. Please try again.')
  }
}

// AI Health Check function
export const checkAIHealth = async () => {
  try {
    console.log('Calling checkAIHealth function...')
    const result = await checkAIHealthFunction()
    return result.data
  } catch (error) {
    console.error('Error checking AI health:', error)
    return {
      aiAvailable: false,
      genkitLoaded: false,
      aiInitialized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

export const mockAnalyzeMenu = async (request: AnalyzeMenuRequest): Promise<AnalyzeMenuResponse> => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    dishes: [
      {
        name: 'Grilled Chicken Salad',
        calories: 420,
        macros: {
          protein: 35,
          carbs: 15,
          fat: 18
        },
        flags: {
          diets: ['keto', 'gluten-free'],
          allergens: []
        }
      },
      {
        name: 'Margherita Pizza',
        calories: 650,
        macros: {
          protein: 25,
          carbs: 80,
          fat: 22
        },
        flags: {
          diets: ['vegetarian'],
          allergens: ['gluten', 'dairy']
        }
      },
      {
        name: 'Beef Burger',
        calories: 580,
        macros: {
          protein: 30,
          carbs: 45,
          fat: 28
        },
        flags: {
          diets: [],
          allergens: ['gluten', 'dairy']
        }
      }
    ],
    model: 'gemini-1.5-flash',
    processingTimeMs: 2000
  }
}