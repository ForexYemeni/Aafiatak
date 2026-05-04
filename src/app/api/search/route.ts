import { NextRequest, NextResponse } from 'next/server'
import { firestore, admin, firebaseInitialized, initializationError } from '@/lib/firebase-admin'

function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ')
  }
}

function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  return { id: doc.id, ...doc.data() }
}

export async function GET(request: NextRequest) {
  try {
    checkFirebase()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim().toLowerCase() || ''
    const type = searchParams.get('type') || 'all' // 'nurses', 'services', or 'all'

    if (!q) {
      return NextResponse.json({ error: 'نص البحث مطلوب' }, { status: 400 })
    }

    const results: {
      nurses: any[]
      services: any[]
    } = {
      nurses: [],
      services: [],
    }

    // Search nurses
    if (type === 'nurses' || type === 'all') {
      const nursesSnapshot = await firestore.collection('nurses')
        .where('status', '==', 'approved')
        .get()

      const nurseResults = nursesSnapshot.docs
        .map(docToObject)
        .filter((nurse: any) => {
          const fullName = `${nurse.firstName || ''} ${nurse.secondName || ''} ${nurse.thirdName || ''} ${nurse.lastName || ''}`.toLowerCase()
          const location = (nurse.location || '').toLowerCase()
          const specializations = (nurse.portfolio?.specializations || []).join(' ').toLowerCase()
          return fullName.includes(q) || location.includes(q) || specializations.includes(q)
        })
        .map((nurse: any) => {
          const { password, ...safeNurse } = nurse
          return safeNurse
        })

      results.nurses = nurseResults
    }

    // Search services
    if (type === 'services' || type === 'all') {
      const servicesSnapshot = await firestore.collection('services')
        .where('isActive', '==', true)
        .get()

      const serviceResults = servicesSnapshot.docs
        .map(docToObject)
        .filter((service: any) => {
          const name = (service.name || '').toLowerCase()
          const description = (service.description || '').toLowerCase()
          const category = (service.category || '').toLowerCase()
          return name.includes(q) || description.includes(q) || category.includes(q)
        })

      results.services = serviceResults
    }

    return NextResponse.json({
      query: q,
      type,
      results,
      totalNurses: results.nurses.length,
      totalServices: results.services.length,
    })
  } catch (error: any) {
    console.error('Search error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
