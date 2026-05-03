import * as admin from 'firebase-admin'

let firebaseInitialized = false
let initializationError: string | null = null
let firestoreInstance: admin.firestore.Firestore | null = null

function parsePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined

  let parsed = key.trim()

  // If the key is base64 encoded (for Netlify compatibility)
  if (!parsed.includes('-----BEGIN')) {
    try {
      const decoded = Buffer.from(parsed, 'base64').toString('utf-8')
      if (decoded.includes('-----BEGIN')) {
        parsed = decoded
      }
    } catch {
      // Not base64, continue with as-is
    }
  }

  // Replace escaped newlines with actual newlines
  parsed = parsed
    .replace(/\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\r\n/g, '\n')

  // Clean up any extra whitespace around the header/footer
  parsed = parsed
    .replace(/-----BEGIN PRIVATE KEY-----\s+/g, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/\s+-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')

  return parsed.trim()
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
}

// Only initialize if ALL required credentials are present AND look valid
const hasValidConfig = firebaseConfig.projectId &&
  firebaseConfig.clientEmail &&
  firebaseConfig.privateKey &&
  firebaseConfig.projectId !== 'your-project-id' &&
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
      initializationError = 'بيانات Firebase غير صالحة. تأكد من صحة المفتاح الخاص أنه يحتوي على -----BEGIN PRIVATE KEY-----'
    }
    console.warn('⚠️ Firebase Admin SDK: Missing or invalid credentials.', missing.length > 0 ? `Missing: ${missing.join(', ')}` : '')
  }
} else {
  firebaseInitialized = true
  firestoreInstance = admin.firestore()
}

export const firestore = firestoreInstance as admin.firestore.Firestore
export { admin, firebaseInitialized, initializationError }
