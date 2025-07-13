import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import { MenuScan, UserPreferences } from '../types'

export const saveScan = async (scanData: Omit<MenuScan, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'scans'), {
      ...scanData,
      createdAt: Timestamp.fromDate(scanData.createdAt),
      updatedAt: Timestamp.fromDate(scanData.updatedAt)
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving scan:', error)
    throw new Error('Failed to save scan')
  }
}

export const getUserScans = async (userId: string): Promise<MenuScan[]> => {
  try {
    const q = query(
      collection(db, 'scans'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as MenuScan[]
  } catch (error) {
    console.error('Error fetching user scans:', error)
    throw new Error('Failed to fetch scans')
  }
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    // For demo purposes, return default preferences
    if (import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-project') {
      return { diets: [], allergens: [] }
    }
    
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().preferences || null
    }
    return null
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return { diets: [], allergens: [] }
  }
}

export const updateUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId)
    await updateDoc(docRef, { preferences })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw new Error('Failed to update preferences')
  }
}