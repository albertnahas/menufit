# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development server with Vite
- `yarn build` - Build frontend (runs TypeScript compilation then Vite build)
- `yarn lint` - Run ESLint with TypeScript support
- `yarn preview` - Preview built application

### Firebase Functions

Navigate to `functions/` directory:
- `yarn build` - Compile TypeScript functions
- `yarn dev` - Watch mode for function development
- `yarn serve` - Start Firebase emulator for functions only
- `firebase emulators:start` - Start all Firebase emulators (run from project root)
- `firebase deploy --only functions` - Deploy functions to Firebase

## Architecture Overview

MenuScan AI is a React + Firebase application that analyzes menu photos using Google Gemini AI.

### Frontend Architecture (React + TypeScript)

- **Pages**: Route-based components in `src/pages/` (Home, Scan, Results, History, Settings, Login)
- **Components**: Reusable UI components in `src/components/`
- **Contexts**: React Context for authentication (`src/contexts/AuthContext.tsx`)
- **Services**: Firebase integration and API calls in `src/services/`
  - `firebase.ts` - Firebase configuration and initialization
  - `firestore.ts` - Firestore operations (scans, user preferences)
  - `storage.ts` - Firebase Storage for image uploads
  - `api.ts` - HTTP client for calling Firebase Functions
- **Types**: TypeScript interfaces in `src/types/index.ts`
- **Utils**: Image compression utilities in `src/utils/`

### Backend Architecture (Firebase Functions)

Located in `functions/src/`:
- `index.ts` - Functions entry point and exports
- `analyzeMenu.ts` - Main function that handles menu analysis requests
- `gemini.ts` - Google Gemini AI integration for image analysis

### Key Data Flow

1. User uploads image → Firebase Storage
2. Frontend calls `analyzeMenu` Cloud Function with image URL
3. Function downloads image, sends to Gemini AI for analysis
4. AI returns structured nutrition/diet/allergen data
5. Results saved to Firestore and returned to frontend
6. Frontend displays results with nutrition breakdown and dietary flags

### Firebase Integration

- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore for user data, scan history, preferences
- **Storage**: Firebase Storage for menu images
- **Functions**: Cloud Functions for AI processing

### Environment Configuration

Frontend uses Vite environment variables (`.env`):
- All Firebase config variables prefixed with `VITE_`

Functions use Firebase config:
- `gemini.api_key` - Set via `firebase functions:config:set gemini.api_key="key"`

### TypeScript Types

Core interfaces defined in `src/types/index.ts`:
- `DishInfo` - Individual dish analysis results
- `AnalyzeMenuRequest/Response` - Function API contracts
- `MenuScan` - Firestore document structure
- `UserPreferences` - User dietary preferences

### State Management

- Authentication state managed via React Context (`AuthContext`)
- Component state using React hooks
- Firebase real-time listeners for data synchronization