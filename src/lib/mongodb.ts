/**
 * عافيتك — MongoDB Atlas Connection
 * مجاني مدى الحياة - بدون حدود يومية
 * Free Tier: 512 MB storage, unlimited reads/writes
 */

import mongoose from 'mongoose'

let isConnected = false
let connectionError: string | null = null

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  connectionError = 'MONGODB_URI غير محدد. يرجى إضافته في ملف .env.local'
  console.warn('⚠️ MONGODB_URI is not set. Database operations will fail.')
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose
  }

  if (!MONGODB_URI) {
    throw new Error(connectionError || 'MONGODB_URI غير محدد')
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: 'aafiatak',
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    })

    isConnected = true
    connectionError = null
    console.log('✅ MongoDB connected successfully')
    return db
  } catch (error: any) {
    isConnected = false
    connectionError = `فشل الاتصال بقاعدة البيانات: ${error.message}`
    console.error('❌ MongoDB connection failed:', error.message)
    throw new Error(connectionError)
  }
}

export function checkDatabase() {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    throw new Error(connectionError || 'قاعدة البيانات غير متصلة. يرجى التحقق من إعدادات MONGODB_URI')
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

export function getDatabaseError(): string | null {
  return connectionError
}

// Helper to convert MongoDB document to plain object with `id` field
export function docToObject(doc: mongoose.Document | null): any {
  if (!doc) return null
  const obj = doc.toObject ? doc.toObject() : doc
  const { _id, __v, ...rest } = obj
  return { id: _id.toString(), ...rest }
}

// Helper to convert array of documents
export function docsToObjects(docs: mongoose.Document[]): any[] {
  return docs.map(docToObject)
}

// Helper to convert timestamps to the same format as Firestore
export function convertTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data
  if (data instanceof Date) {
    return { seconds: Math.floor(data.getTime() / 1000), nanoseconds: 0 }
  }
  if (Array.isArray(data)) return data.map(convertTimestamps)
  const result: any = {}
  for (const key of Object.keys(data)) {
    const val = data[key]
    if (val instanceof Date) {
      result[key] = { seconds: Math.floor(val.getTime() / 1000), nanoseconds: 0 }
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = convertTimestamps(val)
    } else {
      result[key] = val
    }
  }
  return result
}

// Helper to get time from timestamps (Firestore-compatible)
export function getTimeFromTimestamp(t: any): number {
  if (!t) return 0
  if (t instanceof Date) return t.getTime()
  if (typeof t === 'object' && t !== null && 'seconds' in t) return t.seconds * 1000
  return new Date(t).getTime() || 0
}

export { mongoose }
