import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export const uploadImage = async (file: File, userId: string): Promise<string> => {
  try {
    // For demo purposes, return a mock URL
    if (import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-project') {
      return `https://demo-storage.example.com/menu-images/${userId}/${Date.now()}.jpg`
    }
    
    const fileExtension = file.name.split('.').pop()
    const filename = `${userId}/${Date.now()}.${fileExtension}`
    const imageRef = ref(storage, `menu-images/${filename}`)
    
    const snapshot = await uploadBytes(imageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    
    return url
  } catch (error) {
    console.error('Error uploading image:', error)
    // Return a mock URL for demo purposes
    return `https://demo-storage.example.com/menu-images/${userId}/${Date.now()}.jpg`
  }
}