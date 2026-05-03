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
    initializationError = 'بيانات Firebase غير مكتملة أو غير صالحة. يرجى تعيين FIREBASE_PROJECT_ID و FIREBASE_CLIENT_EMAIL و FIREBASE_PRIVATE_KEY في ملف .env.local'
    console.warn('⚠️ Firebase Admin SDK: Missing or invalid credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local')
  }
} else {
  firebaseInitialized = true
  firestoreInstance = admin.firestore()
}

export const firestore = firestoreInstance as admin.firestore.Firestore
export { admin, firebaseInitialized, initializationError }
