# MenuScan AI

A React-based web application that analyzes menu photos to provide instant nutrition information, dietary flags, and allergen warnings.

## Features

- 📸 Photo capture and upload
- 🤖 AI-powered menu analysis using Gemini 1.5 Flash
- 📊 Nutrition breakdown (calories, macros)
- 🥗 Diet flags (vegan, keto, gluten-free, etc.)
- ⚠️ Allergen warnings
- 💾 Scan history and favorites
- ⚙️ Personalized dietary preferences

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase Functions
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Auth
- **AI**: Google Gemini 1.5 Flash

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud account with Gemini API access

### 1. Clone and Install

```bash
git clone <repository-url>
cd MenuScanClaude
yarn install
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Create a new Firebase project
firebase projects:create your-project-id

# Initialize Firebase in your project
firebase use your-project-id

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Get your Firebase config from the Firebase Console → Project Settings → General → Your apps

### 4. Set up Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Set the environment variable for Functions:

```bash
firebase functions:config:set gemini.api_key="your-api-key"
```

### 5. Deploy Functions

```bash
cd functions
yarn install
yarn build
firebase deploy --only functions
```

### 6. Start Development Server

```bash
yarn dev
```

## Firebase Functions

The `analyzeMenu` function handles:
- Image processing
- Gemini AI integration
- Nutrition analysis
- Response formatting

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the frontend
yarn dev
```

## Project Structure

```
src/
├── components/          # React components
├── pages/              # Page components
├── contexts/           # React contexts
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Utility functions

functions/
├── src/
│   ├── index.ts        # Functions entry point
│   ├── analyzeMenu.ts  # Menu analysis handler
│   └── gemini.ts       # Gemini AI integration
└── package.json
```

## Deployment

### Frontend (Firebase Hosting)

```bash
yarn build
firebase deploy --only hosting
```

### Backend (Firebase Functions)

```bash
firebase deploy --only functions
```

### Full Deployment

```bash
firebase deploy
```

## Environment Variables

### Frontend (.env)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Functions (Firebase Config)
- `gemini.api_key` - Gemini API key

## License

MIT