import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../services/firebase'
import { User } from '../types'
import { getUserPreferences } from '../services/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (user: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const preferences = await getUserPreferences(firebaseUser.uid)
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            preferences: preferences || { diets: [], allergens: [] }
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}