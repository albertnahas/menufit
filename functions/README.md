# MenuScan AI - Firebase Functions

Firebase Cloud Functions implementation for MenuScan AI backend services using **Genkit AI** with graceful fallback patterns.

## Key Features

- **Genkit AI Integration** with Google Gemini 1.5 Flash
- **Graceful Fallback** - App continues working even if AI fails
- **CommonJS Pattern** following the established codebase style  
- **GDPR Compliance** - Automatic image deletion after processing
- **Comprehensive Logging** with cost and performance monitoring

## Architecture Overview

Based on the proven patterns from the example codebase:

```javascript
// Graceful AI initialization with fallback
let ai = null
try {
  if (genkit && googleAI && gemini15Flash) {
    ai = genkit({
      plugins: [googleAI()],
      model: gemini15Flash
    })
  }
} catch (error) {
  // AI features disabled but app continues working
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment

**No secrets exposed in code!** All API keys should be configured via Firebase configuration:

```bash
# Set Gemini API key (replace with your actual key)
firebase functions:config:set google.api_key="your-gemini-api-key-here"
```

### 3. Development

```bash
# Start local emulators
npm run serve

# View function logs
npm run logs

# Deploy to Firebase
npm run deploy
```

## Function Overview

### `analyzeMenu` (HTTPS Request)

**PRD Requirements Implemented:**
- ✅ **FR-1**: Node 20 with 2nd gen concurrency (40 concurrent instances)
- ✅ **FR-2**: Accept POST with imageUrl + prefs
- ✅ **FR-3**: Gemini Vision with Genkit integration
- ✅ **FR-5**: Apply diet/allergen preferences
- ✅ **FR-6**: GDPR-compliant image deletion  
- ✅ **FR-7**: Comprehensive metrics logging

**Configuration:**
- Memory: 1GB
- Timeout: 60s
- Max Instances: 40

### `checkAIHealth` (Callable)

Health check endpoint that returns AI service status:

```javascript
{
  aiAvailable: boolean,
  genkitLoaded: boolean, 
  aiInitialized: boolean,
  timestamp: string
}
```

### `feedbackCorrection` (Callable - Future)

Placeholder for user feedback collection (PRD nice-to-have).

## Code Structure

```
functions/
├── src/
│   ├── index.js                    # Main function exports (CommonJS)
│   └── services/
│       └── menuAnalysisService.js  # Advanced AI analysis with fallback
├── package.json                    # Updated with Genkit dependencies
└── README.md
```

## Key Patterns Learned

### 1. Graceful AI Fallback
```javascript
// Always check AI availability before use
const isAIAvailable = () => {
  return ai !== null && typeof ai.generate === 'function'
}

// Graceful error handling in AI calls
try {
  const result = await ai.generate(prompt)
} catch (error) {
  // Log error but continue with fallback
  functions.logger.error('AI failed:', error)
  throw new Error('AI service temporarily unavailable')
}
```

### 2. Structured Logging for Cost Monitoring
```javascript
// PRD requirement: Track costs and performance
const logData = {
  timestamp: new Date().toISOString(),
  function_name: 'analyzeMenu',
  execution_time_ms: processingTime,
  tokens_used: tokensUsed,
  cost_estimate_eur: costEstimate,
  success: true
}
functions.logger.info('function_metrics', logData)
```

### 3. GDPR Image Cleanup
```javascript
// PRD requirement: Delete images after processing
const deleteImageAfterProcessing = async (imageUrl) => {
  try {
    const fileName = extractFileNameFromUrl(imageUrl)
    await admin.storage().bucket().file(fileName).delete()
  } catch (error) {
    // Log but don't fail - best effort deletion
    functions.logger.warn('Image deletion failed:', error.message)
  }
}
```

## Cost & Performance Monitoring

**PRD Targets:**
- ⚡ P95 latency: ≤8s (alerts at >8s)
- 💰 Cost: ≤€0.045 per 1000 scans (alerts at >€0.000045 per scan)
- 🔒 Error rate: <1%

All metrics are logged to Cloud Logging and can be exported to BigQuery for dashboard creation.

## Security

- ✅ No secrets exposed in code
- ✅ Firebase Storage URL validation
- ✅ HTTPS-only image URLs required
- ✅ Authentication required for feedback functions
- ✅ Graceful error handling without exposing internals

## Next Steps

1. **Set up Firebase Secrets**: Configure Google API key
2. **Deploy Functions**: `npm run deploy`
3. **Monitor Metrics**: Set up BigQuery export for cost tracking
4. **Implement Nutrition Service**: Add USDA nutrition lookup (PRD FR-4)
5. **Add Budget Alerts**: Configure cost monitoring at €50/month threshold

The foundation is ready and follows proven patterns for production AI applications! 🚀