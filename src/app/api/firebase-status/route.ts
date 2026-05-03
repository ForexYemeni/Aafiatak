import { NextResponse } from 'next/server'
import { firebaseInitialized, initializationError } from '@/lib/firebase-admin'

export async function GET() {
  return NextResponse.json({
    connected: firebaseInitialized,
    error: initializationError,
  })
}
