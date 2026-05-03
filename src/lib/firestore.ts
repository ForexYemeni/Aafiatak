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
  let query: FirebaseFirestore.Query = firestore.collection('nurses')
  if (status) {
    query = query.where('status', '==', status)
  }
  const snapshot = await query.orderBy('createdAt', 'desc').get()
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
  let query: FirebaseFirestore.Query = firestore.collection('nurses')
  if (status) {
    query = query.where('status', '==', status)
  }
  const snapshot = await query.get()
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
}) {
  checkFirebase()
  const docRef = await firestore.collection('beneficiaries').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return { id: docRef.id, ...data }
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
  const snapshot = await firestore.collection('services')
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
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
  const snapshot = await firestore.collection('serviceRequests').orderBy('createdAt', 'desc').get()
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
  const snapshot = await firestore.collection('serviceRequests')
    .where('beneficiaryId', '==', beneficiaryId)
    .orderBy('createdAt', 'desc')
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
  let query: FirebaseFirestore.Query = firestore.collection('serviceRequests')
  if (status) {
    query = query.where('status', '==', status)
  }
  const snapshot = await query.get()
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
  const snapshot = await firestore.collection('serviceAssignments')
    .where('nurseId', '==', nurseId)
    .orderBy('createdAt', 'desc')
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
  const snapshot = await firestore.collection('paymentMethods')
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get()
  return snapshot.docs.map(docToObject)
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
