import { firestore, admin, firebaseInitialized, initializationError } from './firebase-admin'

// Helper to check Firebase is available
function checkFirebase() {
  if (!firebaseInitialized || !firestore) {
    throw new Error(initializationError || 'Firebase غير مهيأ. يرجى التحقق من إعدادات Firebase في ملف .env.local')
  }
}

// Helper to convert Firestore doc to object with id
function docToObject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  return { id: doc.id, ...doc.data() }
}

// ==================== ADMINS ====================

export async function getAdminByUsername(username: string) {
  checkFirebase()
  const snapshot = await firestore.collection('admins').where('username', '==', username).limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getAdminById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('admins').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function getFirstAdmin() {
  checkFirebase()
  const snapshot = await firestore.collection('admins').limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function createAdmin(data: {
  username: string
  password: string
  name: string
  mustChangePassword: boolean
}) {
  checkFirebase()
  const docRef = await firestore.collection('admins').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateAdmin(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('admins').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('admins').doc(id).get()
  return docToObject(doc)
}

// ==================== NURSES ====================

export async function getNurseByPhone(phone: string) {
  checkFirebase()
  const snapshot = await firestore.collection('nurses').where('phone', '==', phone).limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getNurseByNationalId(nationalId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('nurses').where('nationalId', '==', nationalId).limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getNurseByLicenseNumber(licenseNumber: string) {
  checkFirebase()
  const snapshot = await firestore.collection('nurses').where('licenseNumber', '==', licenseNumber).limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getNurseById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('nurses').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function getAllNurses(status?: string) {
  checkFirebase()
  let snapshot: FirebaseFirestore.QuerySnapshot
  if (status) {
    // Filter in code to avoid composite index
    const allSnapshot = await firestore.collection('nurses').orderBy('createdAt', 'desc').get()
    snapshot = { docs: allSnapshot.docs.filter(d => d.data().status === status) } as any
  } else {
    snapshot = await firestore.collection('nurses').orderBy('createdAt', 'desc').get()
  }
  return snapshot.docs.map(docToObject)
}

export async function createNurse(data: {
  firstName: string
  secondName: string
  thirdName: string
  lastName: string
  phone: string
  location: string
  nationalId: string
  licenseNumber: string
  licenseExpiryDate: string
  password: string
  status: string
}) {
  checkFirebase()
  const docRef = await firestore.collection('nurses').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateNurse(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('nurses').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('nurses').doc(id).get()
  return docToObject(doc)
}

export async function countNurses(status?: string) {
  checkFirebase()
  if (status) {
    // Filter in code to avoid composite index
    const snapshot = await firestore.collection('nurses').get()
    return snapshot.docs.filter(d => d.data().status === status).length
  }
  const snapshot = await firestore.collection('nurses').get()
  return snapshot.size
}

// ==================== BENEFICIARIES ====================

export async function getBeneficiaryByPhone(phone: string) {
  checkFirebase()
  const snapshot = await firestore.collection('beneficiaries').where('phone', '==', phone).limit(1).get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getBeneficiaryById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('beneficiaries').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function createBeneficiary(data: {
  name: string
  phone: string
  location: string
  password: string
  status?: string
}) {
  checkFirebase()
  const docRef = await firestore.collection('beneficiaries').add({
    ...data,
    status: data.status || 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data, status: data.status || 'active' }
}

export async function updateBeneficiary(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('beneficiaries').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('beneficiaries').doc(id).get()
  return docToObject(doc)
}

export async function countBeneficiaries() {
  checkFirebase()
  const snapshot = await firestore.collection('beneficiaries').get()
  return snapshot.size
}

// ==================== SERVICES ====================

export async function getAllServices() {
  checkFirebase()
  const snapshot = await firestore.collection('services').orderBy('createdAt', 'desc').get()
  return snapshot.docs.map(docToObject)
}

export async function getActiveServices() {
  checkFirebase()
  // Fetch all services ordered by createdAt, then filter active ones in code
  // This avoids the need for a composite Firestore index
  const snapshot = await firestore.collection('services')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs
    .filter(doc => doc.data().isActive === true)
    .map(docToObject)
}

export async function getServiceById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('services').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function createService(data: {
  name: string
  description: string
  price: number
  category: string
  isActive: boolean
}) {
  checkFirebase()
  const docRef = await firestore.collection('services').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateService(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('services').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('services').doc(id).get()
  return docToObject(doc)
}

export async function deleteService(id: string) {
  checkFirebase()
  await firestore.collection('services').doc(id).delete()
}

export async function countServices(isActive?: boolean) {
  checkFirebase()
  let query: FirebaseFirestore.Query = firestore.collection('services')
  if (isActive !== undefined) {
    query = query.where('isActive', '==', isActive)
  }
  const snapshot = await query.get()
  return snapshot.size
}

// ==================== SERVICE REQUESTS ====================

export async function getAllServiceRequests() {
  checkFirebase()
  const snapshot = await firestore.collection('serviceRequests')
    .orderBy('createdAt', 'desc')
    .get()
  const requests = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const beneficiaryDoc = await firestore.collection('beneficiaries').doc(data.beneficiaryId).get()
    const serviceDoc = await firestore.collection('services').doc(data.serviceId).get()
    
    // Check for assignment
    const assignmentSnapshot = await firestore.collection('serviceAssignments')
      .where('requestId', '==', doc.id)
      .limit(1)
      .get()
    
    let assignment = null
    if (!assignmentSnapshot.empty) {
      const assignData = assignmentSnapshot.docs[0].data()
      const nurseDoc = await firestore.collection('nurses').doc(assignData.nurseId).get()
      assignment = {
        id: assignmentSnapshot.docs[0].id,
        ...assignData,
        nurse: nurseDoc.exists
          ? {
              id: nurseDoc.id,
              firstName: nurseDoc.data()!.firstName,
              secondName: nurseDoc.data()!.secondName,
              thirdName: nurseDoc.data()!.thirdName,
              lastName: nurseDoc.data()!.lastName,
            }
          : null,
      }
    }

    requests.push({
      id: doc.id,
      ...data,
      beneficiary: beneficiaryDoc.exists
        ? { id: beneficiaryDoc.id, name: beneficiaryDoc.data()!.name, phone: beneficiaryDoc.data()!.phone }
        : null,
      service: serviceDoc.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
        : null,
      assignment,
    })
  }
  return requests
}

export async function getServiceRequestsByBeneficiary(beneficiaryId: string) {
  checkFirebase()
  // Fetch all requests for beneficiary, filter and sort in code to avoid composite index
  const snapshot = await firestore.collection('serviceRequests')
    .where('beneficiaryId', '==', beneficiaryId)
    .get()
  
  const requests = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const serviceDoc = await firestore.collection('services').doc(data.serviceId).get()
    
    // Check for assignment
    const assignmentSnapshot = await firestore.collection('serviceAssignments')
      .where('requestId', '==', doc.id)
      .limit(1)
      .get()
    
    let assignment = null
    if (!assignmentSnapshot.empty) {
      const assignData = assignmentSnapshot.docs[0].data()
      const nurseDoc = await firestore.collection('nurses').doc(assignData.nurseId).get()
      assignment = {
        id: assignmentSnapshot.docs[0].id,
        ...assignData,
        nurse: nurseDoc.exists
          ? {
              id: nurseDoc.id,
              firstName: nurseDoc.data()!.firstName,
              secondName: nurseDoc.data()!.secondName,
              thirdName: nurseDoc.data()!.thirdName,
              lastName: nurseDoc.data()!.lastName,
            }
          : null,
      }
    }

    requests.push({
      id: doc.id,
      ...data,
      service: serviceDoc.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price, description: serviceDoc.data()!.description }
        : null,
      assignment,
    })
  }
  return requests
}

export async function getServiceRequestById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('serviceRequests').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function createServiceRequest(data: {
  beneficiaryId: string
  serviceId: string
  status: string
  paymentMethod?: string | null
  notes?: string | null
  address?: string | null
}) {
  checkFirebase()
  const docRef = await firestore.collection('serviceRequests').add({
    ...data,
    adminNotes: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  
  // Fetch service for the response
  const serviceDoc = await firestore.collection('services').doc(data.serviceId).get()
  return {
    id: docRef.id,
    ...data,
    adminNotes: null,
    service: serviceDoc.exists
      ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
      : null,
  }
}

export async function updateServiceRequest(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('serviceRequests').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  
  // Return the updated request with joined data
  const doc = await firestore.collection('serviceRequests').doc(id).get()
  const requestData = doc.data()!
  
  const beneficiaryDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()
  const serviceDoc = await firestore.collection('services').doc(requestData.serviceId).get()
  
  // Check for assignment
  const assignmentSnapshot = await firestore.collection('serviceAssignments')
    .where('requestId', '==', id)
    .limit(1)
    .get()
  
  let assignment = null
  if (!assignmentSnapshot.empty) {
    const assignData = assignmentSnapshot.docs[0].data()
    const nurseDoc = await firestore.collection('nurses').doc(assignData.nurseId).get()
    assignment = {
      id: assignmentSnapshot.docs[0].id,
      ...assignData,
      nurse: nurseDoc.exists
        ? {
            id: nurseDoc.id,
            firstName: nurseDoc.data()!.firstName,
            secondName: nurseDoc.data()!.secondName,
            thirdName: nurseDoc.data()!.thirdName,
            lastName: nurseDoc.data()!.lastName,
          }
        : null,
    }
  }

  return {
    id: doc.id,
    ...requestData,
    beneficiary: beneficiaryDoc.exists
      ? { id: beneficiaryDoc.id, name: beneficiaryDoc.data()!.name, phone: beneficiaryDoc.data()!.phone }
      : null,
    service: serviceDoc.exists
      ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
      : null,
    assignment,
  }
}

export async function countServiceRequests(status?: string) {
  checkFirebase()
  if (status) {
    // Filter in code to avoid composite index
    const snapshot = await firestore.collection('serviceRequests').get()
    return snapshot.docs.filter(d => d.data().status === status).length
  }
  const snapshot = await firestore.collection('serviceRequests').get()
  return snapshot.size
}

export async function getCompletedServiceRevenue() {
  checkFirebase()
  const snapshot = await firestore.collection('serviceRequests')
    .where('status', '==', 'completed')
    .get()
  
  let totalRevenue = 0
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const serviceDoc = await firestore.collection('services').doc(data.serviceId).get()
    if (serviceDoc.exists) {
      totalRevenue += serviceDoc.data()!.price || 0
    }
  }
  return totalRevenue
}

// ==================== SERVICE ASSIGNMENTS ====================

export async function getAssignmentByRequestId(requestId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('serviceAssignments')
    .where('requestId', '==', requestId)
    .limit(1)
    .get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

export async function getAssignmentsByNurseId(nurseId: string) {
  checkFirebase()
  // Fetch assignments for nurse, sort in code to avoid composite index
  const snapshot = await firestore.collection('serviceAssignments')
    .where('nurseId', '==', nurseId)
    .get()
  
  const assignments = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    const requestDoc = await firestore.collection('serviceRequests').doc(data.requestId).get()
    
    if (requestDoc.exists) {
      const requestData = requestDoc.data()!
      const beneficiaryDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()
      const serviceDoc = await firestore.collection('services').doc(requestData.serviceId).get()
      
      assignments.push({
        id: doc.id,
        ...data,
        request: {
          id: requestDoc.id,
          ...requestData,
          beneficiary: beneficiaryDoc.exists
            ? { id: beneficiaryDoc.id, name: beneficiaryDoc.data()!.name, phone: beneficiaryDoc.data()!.phone, location: beneficiaryDoc.data()!.location }
            : null,
          service: serviceDoc.exists
            ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price, description: serviceDoc.data()!.description }
            : null,
        },
      })
    }
  }
  return assignments
}

export async function createAssignment(data: {
  requestId: string
  nurseId: string
  status: string
}) {
  checkFirebase()
  const docRef = await firestore.collection('serviceAssignments').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Fetch the nurse for the response
  const nurseDoc = await firestore.collection('nurses').doc(data.nurseId).get()
  // Fetch the request with beneficiary and service
  const requestDoc = await firestore.collection('serviceRequests').doc(data.requestId).get()
  const requestData = requestDoc.data()!
  const beneficiaryDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()
  const serviceDoc = await firestore.collection('services').doc(requestData.serviceId).get()

  return {
    id: docRef.id,
    ...data,
    nurse: nurseDoc.exists
      ? { id: nurseDoc.id, firstName: nurseDoc.data()!.firstName, secondName: nurseDoc.data()!.secondName, thirdName: nurseDoc.data()!.thirdName, lastName: nurseDoc.data()!.lastName }
      : null,
    request: {
      id: requestDoc.id,
      ...requestData,
      beneficiary: beneficiaryDoc.exists
        ? { id: beneficiaryDoc.id, name: beneficiaryDoc.data()!.name }
        : null,
      service: serviceDoc.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
        : null,
    },
  }
}

export async function getAssignmentById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('serviceAssignments').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function updateAssignment(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('serviceAssignments').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  
  // Return the updated assignment with joined data
  const doc = await firestore.collection('serviceAssignments').doc(id).get()
  const assignData = doc.data()!
  
  const requestDoc = await firestore.collection('serviceRequests').doc(assignData.requestId).get()
  let requestWithJoins = null
  if (requestDoc.exists) {
    const requestData = requestDoc.data()!
    const beneficiaryDoc = await firestore.collection('beneficiaries').doc(requestData.beneficiaryId).get()
    const serviceDoc = await firestore.collection('services').doc(requestData.serviceId).get()
    requestWithJoins = {
      id: requestDoc.id,
      ...requestData,
      beneficiary: beneficiaryDoc.exists
        ? { id: beneficiaryDoc.id, name: beneficiaryDoc.data()!.name, phone: beneficiaryDoc.data()!.phone }
        : null,
      service: serviceDoc.exists
        ? { id: serviceDoc.id, name: serviceDoc.data()!.name, price: serviceDoc.data()!.price }
        : null,
    }
  }

  return {
    id: doc.id,
    ...assignData,
    request: requestWithJoins,
  }
}

// ==================== PAYMENT METHODS ====================

export async function getAllPaymentMethods() {
  checkFirebase()
  const snapshot = await firestore.collection('paymentMethods').orderBy('createdAt', 'desc').get()
  return snapshot.docs.map(docToObject)
}

export async function getActivePaymentMethods() {
  checkFirebase()
  // Fetch all payment methods ordered by createdAt, then filter active ones in code
  // This avoids the need for a composite Firestore index
  const snapshot = await firestore.collection('paymentMethods')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs
    .filter(doc => doc.data().isActive === true)
    .map(docToObject)
}

export async function getPaymentMethodById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('paymentMethods').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function createPaymentMethod(data: {
  name: string
  accountInfo: string
  isActive: boolean
}) {
  checkFirebase()
  const docRef = await firestore.collection('paymentMethods').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updatePaymentMethod(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('paymentMethods').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('paymentMethods').doc(id).get()
  return docToObject(doc)
}

export async function deletePaymentMethod(id: string) {
  checkFirebase()
  await firestore.collection('paymentMethods').doc(id).delete()
}

// ==================== ACTIVITY LOG ====================

export async function createActivityLog(data: {
  type: string
  description: string
  userId?: string
  userName?: string
  metadata?: Record<string, any>
}) {
  checkFirebase()
  const docRef = await firestore.collection('activityLog').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function getActivityLogs(limitCount: number = 20) {
  checkFirebase()
  const snapshot = await firestore.collection('activityLog')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get()
  return snapshot.docs.map(docToObject)
}

// ==================== ALL BENEFICIARIES WITH DETAILS ====================

export async function getAllBeneficiaries() {
  checkFirebase()
  const snapshot = await firestore.collection('beneficiaries')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(doc => {
    const data = doc.data()
    const { password, ...rest } = data
    return { id: doc.id, ...rest }
  })
}

// ==================== CHAT SYSTEM ====================

export async function getChatMessages(requestId: string, limitCount: number = 50) {
  checkFirebase()
  const snapshot = await firestore.collection('chats')
    .where('requestId', '==', requestId)
    .orderBy('createdAt', 'asc')
    .limit(limitCount)
    .get()
  return snapshot.docs.map(docToObject)
}

export async function sendChatMessage(data: {
  requestId: string
  senderId: string
  senderName: string
  senderType: 'nurse' | 'beneficiary' | 'admin'
  message: string
}) {
  checkFirebase()
  const docRef = await firestore.collection('chats').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

// ==================== COUPONS ====================

export async function createCoupon(data: {
  code: string
  discountPercent: number
  maxUses: number
  expiresAt: string
  isActive: boolean
}) {
  checkFirebase()
  const docRef = await firestore.collection('coupons').add({
    ...data,
    usedCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data, usedCount: 0 }
}

export async function getAllCoupons() {
  checkFirebase()
  const snapshot = await firestore.collection('coupons')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
}

export async function getCouponById(id: string) {
  checkFirebase()
  const doc = await firestore.collection('coupons').doc(id).get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function updateCoupon(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('coupons').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('coupons').doc(id).get()
  return docToObject(doc)
}

export async function deleteCoupon(id: string) {
  checkFirebase()
  await firestore.collection('coupons').doc(id).delete()
}

export async function validateCoupon(code: string) {
  checkFirebase()
  const snapshot = await firestore.collection('coupons')
    .where('code', '==', code)
    .where('isActive', '==', true)
    .limit(1)
    .get()
  if (snapshot.empty) return null

  const coupon = docToObject(snapshot.docs[0])
  const now = new Date()

  // Check expiry
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return null
  }

  // Check max uses
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return null
  }

  return coupon
}

export async function incrementCouponUsage(couponId: string) {
  checkFirebase()
  await firestore.collection('coupons').doc(couponId).update({
    usedCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

// ==================== LOYALTY PROGRAM ====================

export async function getLoyaltyPoints(beneficiaryId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('loyaltyPoints')
    .where('beneficiaryId', '==', beneficiaryId)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
}

export async function addLoyaltyPoints(beneficiaryId: string, points: number, reason: string) {
  checkFirebase()
  const docRef = await firestore.collection('loyaltyPoints').add({
    beneficiaryId,
    points,
    reason,
    type: 'earn',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Update beneficiary total points
  const benefDoc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
  if (benefDoc.exists) {
    const currentPoints = benefDoc.data()!.loyaltyPoints || 0
    await firestore.collection('beneficiaries').doc(beneficiaryId).update({
      loyaltyPoints: currentPoints + points,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  return { id: docRef.id, beneficiaryId, points, reason, type: 'earn' as const }
}

export async function redeemLoyaltyPoints(beneficiaryId: string, points: number) {
  checkFirebase()
  // Check current balance
  const benefDoc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
  if (!benefDoc.exists) throw new Error('المستفيد غير موجود')

  const currentPoints = benefDoc.data()!.loyaltyPoints || 0
  if (currentPoints < points) throw new Error('رصيد النقاط غير كافٍ')

  const docRef = await firestore.collection('loyaltyPoints').add({
    beneficiaryId,
    points: -points,
    reason: `استبدال ${points} نقطة`,
    type: 'redeem',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await firestore.collection('beneficiaries').doc(beneficiaryId).update({
    loyaltyPoints: currentPoints - points,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { id: docRef.id, beneficiaryId, points: -points, reason: `استبدال ${points} نقطة`, type: 'redeem' as const }
}

export async function getLoyaltyBalance(beneficiaryId: string) {
  checkFirebase()
  const doc = await firestore.collection('beneficiaries').doc(beneficiaryId).get()
  if (!doc.exists) return 0
  return doc.data()!.loyaltyPoints || 0
}

// ==================== EMERGENCY REQUESTS ====================

export async function createEmergencyRequest(data: {
  beneficiaryId: string
  serviceType: string
  address: string
  notes?: string
}) {
  checkFirebase()
  const benefDoc = await firestore.collection('beneficiaries').doc(data.beneficiaryId).get()
  const beneficiaryName = benefDoc.exists ? benefDoc.data()!.name : 'غير معروف'

  const docRef = await firestore.collection('emergencyRequests').add({
    ...data,
    beneficiaryName,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data, beneficiaryName, status: 'pending' }
}

// ==================== REFERRAL SYSTEM ====================

export async function generateReferralCode(beneficiaryId: string) {
  checkFirebase()
  // Check if already has a code
  const snapshot = await firestore.collection('referrals')
    .where('beneficiaryId', '==', beneficiaryId)
    .limit(1)
    .get()

  if (!snapshot.empty) {
    return docToObject(snapshot.docs[0])
  }

  // Generate unique code
  const code = 'AFY-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  const docRef = await firestore.collection('referrals').add({
    beneficiaryId,
    code,
    uses: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, beneficiaryId, code, uses: 0 }
}

export async function applyReferralCode(code: string, newBeneficiaryId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('referrals')
    .where('code', '==', code)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const referral = docToObject(snapshot.docs[0])

  // Can't use own code
  if (referral.beneficiaryId === newBeneficiaryId) {
    throw new Error('لا يمكنك استخدام كود الإحالة الخاص بك')
  }

  // Increment uses
  await firestore.collection('referrals').doc(referral.id).update({
    uses: admin.firestore.FieldValue.increment(1),
  })

  // Give both parties loyalty points
  await addLoyaltyPoints(referral.beneficiaryId, 50, 'مكافأة إحالة - شخص جديد استخدم كودك')
  await addLoyaltyPoints(newBeneficiaryId, 25, 'مكافأة إحالة - استخدمت كود إحالة')

  return { ...referral, uses: referral.uses + 1 }
}

export async function getReferralByBeneficiary(beneficiaryId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('referrals')
    .where('beneficiaryId', '==', beneficiaryId)
    .limit(1)
    .get()
  if (snapshot.empty) return null
  return docToObject(snapshot.docs[0])
}

// ==================== NURSE DELETE / BLOCK / UNBLOCK ====================

export async function deleteNurse(id: string) {
  checkFirebase()
  // Delete nurse's assignments first
  const assignmentsSnapshot = await firestore.collection('serviceAssignments')
    .where('nurseId', '==', id)
    .get()
  const batch = firestore.batch()
  for (const doc of assignmentsSnapshot.docs) {
    batch.delete(doc.ref)
  }
  await batch.commit()
  // Delete the nurse document
  await firestore.collection('nurses').doc(id).delete()
}

export async function blockNurse(id: string) {
  checkFirebase()
  await firestore.collection('nurses').doc(id).update({
    status: 'blocked',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('nurses').doc(id).get()
  return docToObject(doc)
}

export async function unblockNurse(id: string) {
  checkFirebase()
  await firestore.collection('nurses').doc(id).update({
    status: 'approved',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('nurses').doc(id).get()
  return docToObject(doc)
}

// ==================== BENEFICIARY DELETE / BLOCK / UNBLOCK ====================

export async function deleteBeneficiary(id: string) {
  checkFirebase()
  // Delete beneficiary's service requests first
  const requestsSnapshot = await firestore.collection('serviceRequests')
    .where('beneficiaryId', '==', id)
    .get()
  const batch = firestore.batch()
  for (const doc of requestsSnapshot.docs) {
    batch.delete(doc.ref)
  }
  await batch.commit()
  // Delete the beneficiary document
  await firestore.collection('beneficiaries').doc(id).delete()
}

export async function blockBeneficiary(id: string) {
  checkFirebase()
  await firestore.collection('beneficiaries').doc(id).update({
    status: 'blocked',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('beneficiaries').doc(id).get()
  return docToObject(doc)
}

export async function unblockBeneficiary(id: string) {
  checkFirebase()
  await firestore.collection('beneficiaries').doc(id).update({
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('beneficiaries').doc(id).get()
  return docToObject(doc)
}

// ==================== ADMIN SETTINGS ====================

export async function getAdminSettings() {
  checkFirebase()
  const doc = await firestore.collection('appSettings').doc('admin').get()
  if (!doc.exists) return null
  return docToObject(doc)
}

export async function updateAdminSettings(data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('appSettings').doc('admin').set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  const doc = await firestore.collection('appSettings').doc('admin').get()
  return docToObject(doc)
}

// ==================== RATINGS ====================

export async function getNurseRatings(nurseId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('ratings')
    .where('nurseId', '==', nurseId)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
}

export async function getAllRatings() {
  checkFirebase()
  const snapshot = await firestore.collection('ratings')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
}

export async function createRating(data: {
  requestId: string
  nurseId: string
  beneficiaryId: string
  beneficiaryName: string
  nurseName: string
  rating: number
  comment?: string
  serviceName?: string
}) {
  checkFirebase()
  const docRef = await firestore.collection('ratings').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

// ==================== SUB-ADMINS ====================

export async function getSubAdmins(adminId: string) {
  checkFirebase()
  const snapshot = await firestore.collection('subAdmins')
    .where('adminId', '==', adminId)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(doc => {
    const data = doc.data()
    const { password, ...rest } = data
    return { id: doc.id, ...rest }
  })
}

export async function createSubAdmin(data: {
  adminId: string
  name: string
  phone: string
  password: string
  permissions: Record<string, boolean>
}) {
  checkFirebase()
  const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(data.password, 10))
  const docRef = await firestore.collection('subAdmins').add({
    ...data,
    password: hashedPassword,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const { password: _, ...safeData } = data
  return { id: docRef.id, ...safeData, status: 'active' }
}

export async function updateSubAdmin(id: string, data: Record<string, any>) {
  checkFirebase()
  const updateData: Record<string, any> = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
  // If password is being updated, hash it
  if (data.password) {
    const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(data.password, 10))
    updateData.password = hashedPassword
  }
  await firestore.collection('subAdmins').doc(id).update(updateData)
  const doc = await firestore.collection('subAdmins').doc(id).get()
  const docData = doc.data()!
  const { password, ...rest } = docData
  return { id: doc.id, ...rest }
}

export async function deleteSubAdmin(id: string) {
  checkFirebase()
  await firestore.collection('subAdmins').doc(id).delete()
}

// ==================== EMERGENCY REQUESTS (ADMIN) ====================

export async function getEmergencyRequests() {
  checkFirebase()
  const snapshot = await firestore.collection('emergencyRequests')
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
}

export async function updateEmergencyRequest(id: string, data: Record<string, any>) {
  checkFirebase()
  await firestore.collection('emergencyRequests').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  const doc = await firestore.collection('emergencyRequests').doc(id).get()
  return docToObject(doc)
}
