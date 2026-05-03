import * as admin from 'firebase-admin'

let firebaseInitialized = false
let initializationError: string | null = null
let firestoreInstance: admin.firestore.Firestore | null = null

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

// Only initialize if ALL required credentials are present AND look valid
const hasValidConfig = firebaseConfig.projectId &&
  firebaseConfig.clientEmail &&
  firebaseConfig.privateKey &&
  firebaseConfig.projectId !== 'your-project-id' &&
  firebaseConfig.privateKey !== 'your-private-key' &&
  firebaseConfig.privateKey.includes('-----BEGIN')

if (!admin.apps.length) {
  if (hasValidConfig) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      })
      firebaseInitialized = true
      firestoreInstance = admin.firestore()
      console.log('✅ Firebase Admin SDK initialized successfully')
    } catch (error: any) {
      initializationError = `فشل تهيئة Firebase: ${error.message}`
      console.error('❌ Firebase Admin SDK initialization failed:', error.message)
    }
  } else {
    // Provide specific error message based on what's missing
    const missing = []
    if (!firebaseConfig.projectId) missing.push('FIREBASE_PROJECT_ID')
    if (!firebaseConfig.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
    if (!firebaseConfig.privateKey) missing.push('FIREBASE_PRIVATE_KEY')
    
    if (missing.length > 0) {
      initializationError = `بيانات Firebase غير مكتملة. المتغيرات الناقصة: ${missing.join(', ')}`
    } else {
      initializationError = 'بيانات Firebase غير صالحة. تأكد من صحة المفتاح الخاص.'
    }
    console.warn('⚠️ Firebase Admin SDK: Missing or invalid credentials.', missing.length > 0 ? `Missing: ${missing.join(', ')}` : '')
  }
} else {
  firebaseInitialized = true
  firestoreInstance = admin.firestore()
}

export const firestore = firestoreInstance as admin.firestore.Firestore
export { admin, firebaseInitialized, initializationError }
