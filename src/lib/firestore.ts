/**
 * عافيتك — MongoDB Data Access Layer
 * Migrated from Firebase Firestore to MongoDB (Mongoose)
 * All function signatures remain identical for backward compatibility
 */

import { connectToDatabase, docToObject, docsToObjects, convertTimestamps, getTimeFromTimestamp, mongoose } from './mongodb'

// ==================== MONGOOSE MODELS ====================
// Using strict: false to allow flexible data (matching Firestore's schema-less nature)
// Using mongoose.models.X || mongoose.model('X', schema) pattern to prevent recompilation errors
// Using `any` model types to avoid TypeScript issues with strict:false schemas

const Schema = mongoose.Schema

function getModel(name: string, schemaDef: any, collection: string): any {
  if (mongoose.models[name]) return mongoose.models[name]
  const schema = new Schema(schemaDef, { strict: false, timestamps: false })
  return mongoose.model(name, schema, collection)
}

const Admin = getModel('Admin', {
  username: String, phone: String, password: String, name: String,
  mustChangePassword: Boolean, createdAt: Date, updatedAt: Date,
}, 'admins')

const SubAdmin = getModel('SubAdmin', {
  name: String, phone: String, password: String, adminId: String,
  permissions: Object, status: String, createdAt: Date, updatedAt: Date,
}, 'subadmins')

const Nurse = getModel('Nurse', {
  firstName: String, secondName: String, thirdName: String, lastName: String,
  phone: String, location: String, nationalId: String, licenseNumber: String,
  licenseExpiryDate: String, password: String, status: String, isVerified: Boolean,
  verifiedAt: Date, portfolio: Object, specialties: [String], rating: Number,
  totalRatings: Number, location_lat: Number, location_lng: Number,
  rejectionReason: String, currentLocation: Object, createdAt: Date, updatedAt: Date,
}, 'nurses')

const Beneficiary = getModel('Beneficiary', {
  name: String, phone: String, location: String, password: String,
  status: String, loyaltyPoints: Number, favoriteNurseId: String,
  createdAt: Date, updatedAt: Date,
}, 'beneficiaries')

const Service = getModel('Service', {
  name: String, description: String, price: Number, category: String,
  isActive: Boolean, image: String, estimatedDuration: String,
  createdAt: Date, updatedAt: Date,
}, 'services')

const ServiceRequest = getModel('ServiceRequest', {
  beneficiaryId: String, serviceId: String, status: String,
  paymentMethod: String, paymentMethodId: String, notes: String, address: String,
  serviceIds: [String], services: Array, isMultiService: Boolean,
  couponCode: String, requestFavoriteNurse: Boolean, dynamicPrice: Number,
  pricingBreakdown: Object, commission: Object, paymentStatus: String,
  adminNotes: String, rejectionReason: String, beneficiaryName: String,
  createdAt: Date, updatedAt: Date,
}, 'servicerequests')

const ServiceAssignment = getModel('ServiceAssignment', {
  requestId: String, nurseId: String, status: String, rejectionReason: String,
  acceptedAt: Date, completedAt: Date, createdAt: Date, updatedAt: Date,
}, 'serviceassignments')

const EmergencyRequest = getModel('EmergencyRequest', {
  beneficiaryId: String, beneficiaryName: String, serviceType: String,
  address: String, notes: String, price: Number, dynamicPrice: Number,
  pricingBreakdown: Object, commission: Object, paymentMethod: String,
  paymentMethodId: String, paymentStatus: String, status: String,
  isEmergency: Boolean, createdAt: Date, updatedAt: Date,
}, 'emergencyrequests')

const EmergencyAssignment = getModel('EmergencyAssignment', {
  emergencyRequestId: String, nurseId: String, status: String,
  createdAt: Date, updatedAt: Date,
}, 'emergencyassignments')

const PaymentMethodModel = getModel('PaymentMethod', {
  name: String, accountInfo: String, isActive: Boolean,
  createdAt: Date, updatedAt: Date,
}, 'paymentmethods')

const ActivityLog = getModel('ActivityLog', {
  type: String, description: String, userId: String, userName: String,
  metadata: Object, createdAt: Date,
}, 'activitylog')

const Chat = getModel('Chat', {
  requestId: String, senderId: String, senderName: String,
  senderType: String, message: String, createdAt: Date,
}, 'chats')

const Coupon = getModel('Coupon', {
  code: String, discountPercent: Number, maxUses: Number, usedCount: Number,
  expiresAt: String, isActive: Boolean, createdAt: Date, updatedAt: Date,
}, 'coupons')

const LoyaltyPoint = getModel('LoyaltyPoint', {
  beneficiaryId: String, points: Number, reason: String, type: String,
  createdAt: Date,
}, 'loyaltypoints')

const Referral = getModel('Referral', {
  beneficiaryId: String, code: String, uses: Number, createdAt: Date,
}, 'referrals')

const PushNotification = getModel('PushNotification', {
  userId: String, userType: String, title: String, message: String,
  type: String, data: Object, isRead: Boolean, read: Boolean,
  createdAt: Date, updatedAt: Date,
}, 'pushnotifications')

const FcmToken = getModel('FcmToken', {
  userId: String, userType: String, token: String, isActive: Boolean,
  deviceInfo: Object, createdAt: Date, updatedAt: Date,
}, 'fcmtokens')

const Rating = getModel('Rating', {
  requestId: String, fromUserId: String, fromUserName: String, fromUserType: String,
  toUserId: String, toUserName: String, toUserType: String,
  nurseId: String, beneficiaryId: String, beneficiaryName: String, nurseName: String,
  serviceName: String, rating: Number, overallRating: Number, comment: String,
  criteria: Object, beforePhotos: [String], afterPhotos: [String],
  reply: String, replyCreatedAt: Date, nurseReply: Object,
  createdAt: Date, updatedAt: Date,
}, 'ratings')

const AdminSetting = getModel('AdminSetting', {
  key: String, value: mongoose.Schema.Types.Mixed, subAdminId: String,
  createdAt: Date, updatedAt: Date,
}, 'adminsettings')

const WhatsappQueue = getModel('WhatsappQueue', {
  phone: String, message: String, type: String, userId: String,
  status: String, attempts: Number, createdAt: Date,
}, 'whatsappqueue')

const AppSetting = getModel('AppSetting', {}, 'appsettings')

const Appointment = getModel('Appointment', {
  beneficiaryId: String, serviceId: String, nurseId: String,
  date: String, time: String, notes: String, status: String,
  createdAt: Date, updatedAt: Date,
}, 'appointments')

const Report = getModel('Report', {
  reporterId: String, reporterType: String, reportedId: String,
  reportedType: String, type: String, description: String,
  images: [String], status: String, adminResponse: String,
  createdAt: Date, updatedAt: Date,
}, 'reports')

const Transaction = getModel('Transaction', {
  requestId: String, beneficiaryId: String, amount: Number,
  paymentMethod: String, transactionRef: String, status: String,
  createdAt: Date, updatedAt: Date,
}, 'transactions')

// ==================== HELPER ====================

function sortByCreatedAt(docs: any[], direction: 'asc' | 'desc' = 'desc') {
  return docs.sort((a: any, b: any) => {
    const aTime = getTimeFromTimestamp(a.createdAt)
    const bTime = getTimeFromTimestamp(b.createdAt)
    return direction === 'desc' ? bTime - aTime : aTime - bTime
  })
}

// ==================== ADMINS ====================

export async function getAdminByUsername(username: string) {
  await connectToDatabase()
  const doc = await Admin.findOne({ username }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getAdminById(id: string) {
  await connectToDatabase()
  const doc = await Admin.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getFirstAdmin() {
  await connectToDatabase()
  const doc = await Admin.findOne().lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getAdminByPhone(phone: string) {
  await connectToDatabase()
  const doc = await Admin.findOne({ phone }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createAdmin(data: {
  username: string
  phone?: string
  password: string
  name: string
  mustChangePassword: boolean
}) {
  await connectToDatabase()
  const doc = await Admin.create({
    ...data,
    phone: data.phone || data.username,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, phone: data.phone || data.username }
}

export async function updateAdmin(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Admin.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Admin.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== SUB-ADMINS ====================

export async function getSubAdminByPhone(phone: string) {
  await connectToDatabase()
  const doc = await SubAdmin.findOne({ phone }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getSubAdminById(id: string) {
  await connectToDatabase()
  const doc = await SubAdmin.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getAllSubAdmins() {
  await connectToDatabase()
  const docs = await SubAdmin.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => {
    const obj = convertTimestamps(docToObject(doc))
    const { password, ...rest } = obj
    return rest
  })
}

export async function getSubAdmins(adminId: string) {
  await connectToDatabase()
  const docs = await SubAdmin.find({ adminId }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => {
    const obj = convertTimestamps(docToObject(doc))
    const { password, ...rest } = obj
    return rest
  })
}

export async function createSubAdmin(data: {
  name: string
  phone: string
  password: string
  adminId: string
  permissions: Record<string, boolean>
}) {
  await connectToDatabase()
  const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(data.password, 10))
  const doc = await SubAdmin.create({
    ...data,
    password: hashedPassword,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const { password: _, ...safeData } = data
  const obj = docToObject(doc)
  return { id: obj.id, ...safeData, status: 'active' }
}

export async function updateSubAdmin(id: string, data: Record<string, any>) {
  await connectToDatabase()
  const updateData: Record<string, any> = { ...data, updatedAt: new Date() }
  if (data.password) {
    const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(data.password, 10))
    updateData.password = hashedPassword
  }
  await SubAdmin.findByIdAndUpdate(id, updateData)
  const doc = await SubAdmin.findById(id).lean()
  if (!doc) return null
  const obj = convertTimestamps(docToObject(doc))
  const { password, ...rest } = obj
  return rest
}

export async function deleteSubAdmin(id: string) {
  await connectToDatabase()
  await SubAdmin.findByIdAndDelete(id)
}

// ==================== NURSES ====================

export async function getNurseByPhone(phone: string) {
  await connectToDatabase()
  const doc = await Nurse.findOne({ phone }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getNurseByNationalId(nationalId: string) {
  await connectToDatabase()
  const doc = await Nurse.findOne({ nationalId }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getNurseByLicenseNumber(licenseNumber: string) {
  await connectToDatabase()
  const doc = await Nurse.findOne({ licenseNumber }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getNurseById(id: string) {
  await connectToDatabase()
  const doc = await Nurse.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getAllNurses(status?: string) {
  await connectToDatabase()
  const filter: any = {}
  if (status) filter.status = status
  const docs = await Nurse.find(filter).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
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
  isVerified?: boolean
}) {
  await connectToDatabase()
  const doc = await Nurse.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function updateNurse(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Nurse.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Nurse.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function countNurses(status?: string) {
  await connectToDatabase()
  const filter: any = {}
  if (status) filter.status = status
  return Nurse.countDocuments(filter)
}

export async function deleteNurse(id: string) {
  await connectToDatabase()
  await ServiceAssignment.deleteMany({ nurseId: id })
  await Nurse.findByIdAndDelete(id)
}

export async function blockNurse(id: string) {
  await connectToDatabase()
  await Nurse.findByIdAndUpdate(id, { status: 'blocked', updatedAt: new Date() })
  const doc = await Nurse.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function unblockNurse(id: string) {
  await connectToDatabase()
  await Nurse.findByIdAndUpdate(id, { status: 'approved', updatedAt: new Date() })
  const doc = await Nurse.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function verifyNurse(nurseId: string, verified: boolean) {
  await connectToDatabase()
  if (verified) {
    await Nurse.findByIdAndUpdate(nurseId, {
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    // Use $unset to remove the field (equivalent to FieldValue.delete())
    await Nurse.findByIdAndUpdate(nurseId, {
      $set: { isVerified: false, updatedAt: new Date() },
      $unset: { verifiedAt: '' },
    })
  }
  const doc = await Nurse.findById(nurseId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== BENEFICIARIES ====================

export async function getBeneficiaryByPhone(phone: string) {
  await connectToDatabase()
  const doc = await Beneficiary.findOne({ phone }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getBeneficiaryById(id: string) {
  await connectToDatabase()
  const doc = await Beneficiary.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createBeneficiary(data: {
  name: string
  phone: string
  location: string
  password: string
  status?: string
}) {
  await connectToDatabase()
  const doc = await Beneficiary.create({
    ...data,
    status: data.status || 'active',
    loyaltyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, status: data.status || 'active' }
}

export async function updateBeneficiary(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Beneficiary.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Beneficiary.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function countBeneficiaries() {
  await connectToDatabase()
  return Beneficiary.countDocuments()
}

export async function getAllBeneficiaries() {
  await connectToDatabase()
  const docs = await Beneficiary.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => {
    const obj = convertTimestamps(docToObject(doc))
    const { password, ...rest } = obj
    return rest
  })
}

export async function deleteBeneficiary(id: string) {
  await connectToDatabase()
  await ServiceRequest.deleteMany({ beneficiaryId: id })
  await Beneficiary.findByIdAndDelete(id)
}

export async function blockBeneficiary(id: string) {
  await connectToDatabase()
  await Beneficiary.findByIdAndUpdate(id, { status: 'blocked', updatedAt: new Date() })
  const doc = await Beneficiary.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function unblockBeneficiary(id: string) {
  await connectToDatabase()
  await Beneficiary.findByIdAndUpdate(id, { status: 'active', updatedAt: new Date() })
  const doc = await Beneficiary.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== SERVICES ====================

export async function getAllServices() {
  await connectToDatabase()
  const docs = await Service.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getActiveServices() {
  await connectToDatabase()
  const docs = await Service.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getServiceById(id: string) {
  await connectToDatabase()
  const doc = await Service.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createService(data: {
  name: string
  description: string
  price: number
  category: string
  isActive: boolean
}) {
  await connectToDatabase()
  const doc = await Service.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function updateService(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Service.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Service.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function deleteService(id: string) {
  await connectToDatabase()
  await Service.findByIdAndDelete(id)
}

export async function countServices(isActive?: boolean) {
  await connectToDatabase()
  const filter: any = {}
  if (isActive !== undefined) filter.isActive = isActive
  return Service.countDocuments(filter)
}

export async function searchServices(query: string, category?: string) {
  await connectToDatabase()
  const filter: any = { isActive: true }
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ]
  }
  if (category) filter.category = category
  const docs = await Service.find(filter).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

// ==================== SERVICE REQUESTS ====================

export async function getAllServiceRequests() {
  await connectToDatabase()
  const docs = await ServiceRequest.find().sort({ createdAt: -1 }).lean()
  const requests: any[] = []
  for (const doc of docs) {
    const data = convertTimestamps(docToObject(doc))

    const beneficiaryDoc = await Beneficiary.findById(data.beneficiaryId).lean()
    const serviceDoc = await Service.findById(data.serviceId).lean()

    const assignDoc = await ServiceAssignment.findOne({ requestId: data.id }).lean()

    let assignment = null
    if (assignDoc) {
      const assignData = convertTimestamps(docToObject(assignDoc))
      const nurseDoc = await Nurse.findById(assignData.nurseId).lean()
      assignment = {
        id: assignData.id,
        ...assignData,
        nurse: nurseDoc
          ? {
              id: docToObject(nurseDoc).id,
              firstName: nurseDoc.firstName,
              secondName: nurseDoc.secondName,
              thirdName: nurseDoc.thirdName,
              lastName: nurseDoc.lastName,
              phone: nurseDoc.phone || null,
            }
          : null,
      }
    }

    requests.push({
      id: data.id,
      ...data,
      beneficiary: beneficiaryDoc
        ? { id: docToObject(beneficiaryDoc).id, name: beneficiaryDoc.name, phone: beneficiaryDoc.phone, location: beneficiaryDoc.location || null }
        : null,
      service: serviceDoc
        ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price }
        : null,
      assignment,
    })
  }
  return requests
}

export async function getServiceRequestsByBeneficiary(beneficiaryId: string) {
  await connectToDatabase()
  const docs = await ServiceRequest.find({ beneficiaryId }).sort({ createdAt: -1 }).lean()

  const requests: any[] = []
  for (const doc of docs) {
    const data = convertTimestamps(docToObject(doc))
    const serviceDoc = await Service.findById(data.serviceId).lean()

    const assignDoc = await ServiceAssignment.findOne({ requestId: data.id }).lean()

    let assignment = null
    if (assignDoc) {
      const assignData = convertTimestamps(docToObject(assignDoc))
      const nurseDoc = await Nurse.findById(assignData.nurseId).lean()
      assignment = {
        id: assignData.id,
        ...assignData,
        nurse: nurseDoc
          ? {
              id: docToObject(nurseDoc).id,
              firstName: nurseDoc.firstName,
              secondName: nurseDoc.secondName,
              thirdName: nurseDoc.thirdName,
              lastName: nurseDoc.lastName,
              phone: nurseDoc.phone || null,
            }
          : null,
      }
    }

    requests.push({
      id: data.id,
      ...data,
      service: serviceDoc
        ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price, description: serviceDoc.description }
        : null,
      assignment,
    })
  }
  return requests
}

export async function getServiceRequestById(id: string) {
  await connectToDatabase()
  const doc = await ServiceRequest.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createServiceRequest(data: {
  beneficiaryId: string
  serviceId: string
  status: string
  paymentMethod?: string | null
  paymentMethodId?: string | null
  notes?: string | null
  address?: string | null
  serviceIds?: string[]
  services?: Array<{ id: string; name: string; price: number }>
  isMultiService?: boolean
  couponCode?: string | null
  requestFavoriteNurse?: boolean | null
  dynamicPrice?: number | null
  pricingBreakdown?: Record<string, any> | null
  commission?: Record<string, any> | null
  paymentStatus?: string
}) {
  await connectToDatabase()
  const doc = await ServiceRequest.create({
    ...data,
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)

  const serviceDoc = await Service.findById(data.serviceId).lean()
  return {
    id: obj.id,
    ...data,
    adminNotes: null,
    service: serviceDoc
      ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price }
      : null,
  }
}

export async function updateServiceRequest(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await ServiceRequest.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })

  const updatedDoc = await ServiceRequest.findById(id).lean()
  if (!updatedDoc) return null
  const requestData = convertTimestamps(docToObject(updatedDoc))

  const beneficiaryDoc = await Beneficiary.findById(requestData.beneficiaryId).lean()
  const serviceDoc = await Service.findById(requestData.serviceId).lean()

  const assignDoc = await ServiceAssignment.findOne({ requestId: id }).lean()

  let assignment = null
  if (assignDoc) {
    const assignData = convertTimestamps(docToObject(assignDoc))
    const nurseDoc = await Nurse.findById(assignData.nurseId).lean()
    assignment = {
      id: assignData.id,
      ...assignData,
      nurse: nurseDoc
        ? {
            id: docToObject(nurseDoc).id,
            firstName: nurseDoc.firstName,
            secondName: nurseDoc.secondName,
            thirdName: nurseDoc.thirdName,
            lastName: nurseDoc.lastName,
            phone: nurseDoc.phone || null,
          }
        : null,
    }
  }

  return {
    id: requestData.id,
    ...requestData,
    beneficiary: beneficiaryDoc
      ? { id: docToObject(beneficiaryDoc).id, name: beneficiaryDoc.name, phone: beneficiaryDoc.phone }
      : null,
    service: serviceDoc
      ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price }
      : null,
    assignment,
  }
}

export async function countServiceRequests(status?: string) {
  await connectToDatabase()
  const filter: any = {}
  if (status) filter.status = status
  return ServiceRequest.countDocuments(filter)
}

export async function getCompletedServiceRevenue() {
  await connectToDatabase()
  const completedRequests = await ServiceRequest.find({ status: 'completed' }).lean()

  let totalRevenue = 0
  for (const req of completedRequests) {
    const serviceDoc = await Service.findById(req.serviceId).lean()
    if (serviceDoc) {
      totalRevenue += serviceDoc.price || 0
    }
  }
  return totalRevenue
}

// ==================== SERVICE ASSIGNMENTS ====================

export async function getAssignmentByRequestId(requestId: string) {
  await connectToDatabase()
  const doc = await ServiceAssignment.findOne({ requestId }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getAssignmentsByNurseId(nurseId: string) {
  await connectToDatabase()
  const assignmentDocs = await ServiceAssignment.find({ nurseId }).lean()

  const assignments: any[] = []
  for (const doc of assignmentDocs) {
    const data = convertTimestamps(docToObject(doc))
    const requestDoc = await ServiceRequest.findById(data.requestId).lean()

    if (requestDoc) {
      const requestData = convertTimestamps(docToObject(requestDoc))
      const beneficiaryDoc = await Beneficiary.findById(requestData.beneficiaryId).lean()
      const serviceDoc = await Service.findById(requestData.serviceId).lean()

      assignments.push({
        id: data.id,
        ...data,
        request: {
          id: requestData.id,
          ...requestData,
          beneficiary: beneficiaryDoc
            ? { id: docToObject(beneficiaryDoc).id, name: beneficiaryDoc.name, phone: beneficiaryDoc.phone, location: beneficiaryDoc.location }
            : null,
          service: serviceDoc
            ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price, description: serviceDoc.description }
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
  await connectToDatabase()
  const doc = await ServiceAssignment.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)

  const nurseDoc = await Nurse.findById(data.nurseId).lean()
  const requestDoc = await ServiceRequest.findById(data.requestId).lean()
  const requestData = convertTimestamps(docToObject(requestDoc!))
  const beneficiaryDoc = await Beneficiary.findById(requestData.beneficiaryId).lean()
  const serviceDoc = await Service.findById(requestData.serviceId).lean()

  return {
    id: obj.id,
    ...data,
    nurse: nurseDoc
      ? { id: docToObject(nurseDoc).id, firstName: nurseDoc.firstName, secondName: nurseDoc.secondName, thirdName: nurseDoc.thirdName, lastName: nurseDoc.lastName, phone: nurseDoc.phone || null }
      : null,
    request: {
      id: requestData.id,
      ...requestData,
      beneficiary: beneficiaryDoc
        ? { id: docToObject(beneficiaryDoc).id, name: beneficiaryDoc.name }
        : null,
      service: serviceDoc
        ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price }
        : null,
    },
  }
}

export async function getAssignmentById(id: string) {
  await connectToDatabase()
  const doc = await ServiceAssignment.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function updateAssignment(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await ServiceAssignment.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })

  const updatedDoc = await ServiceAssignment.findById(id).lean()
  if (!updatedDoc) return null
  const assignData = convertTimestamps(docToObject(updatedDoc))

  const requestDoc = await ServiceRequest.findById(assignData.requestId).lean()
  let requestWithJoins = null
  if (requestDoc) {
    const requestData = convertTimestamps(docToObject(requestDoc))
    const beneficiaryDoc = await Beneficiary.findById(requestData.beneficiaryId).lean()
    const serviceDoc = await Service.findById(requestData.serviceId).lean()
    requestWithJoins = {
      id: requestData.id,
      ...requestData,
      beneficiary: beneficiaryDoc
        ? { id: docToObject(beneficiaryDoc).id, name: beneficiaryDoc.name, phone: beneficiaryDoc.phone }
        : null,
      service: serviceDoc
        ? { id: docToObject(serviceDoc).id, name: serviceDoc.name, price: serviceDoc.price }
        : null,
    }
  }

  return {
    id: assignData.id,
    ...assignData,
    request: requestWithJoins,
  }
}

// ==================== PAYMENT METHODS ====================

export async function getAllPaymentMethods() {
  await connectToDatabase()
  const docs = await PaymentMethodModel.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getActivePaymentMethods() {
  await connectToDatabase()
  const docs = await PaymentMethodModel.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getPaymentMethodById(id: string) {
  await connectToDatabase()
  const doc = await PaymentMethodModel.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createPaymentMethod(data: {
  name: string
  accountInfo: string
  isActive: boolean
}) {
  await connectToDatabase()
  const doc = await PaymentMethodModel.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function updatePaymentMethod(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await PaymentMethodModel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await PaymentMethodModel.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function deletePaymentMethod(id: string) {
  await connectToDatabase()
  await PaymentMethodModel.findByIdAndDelete(id)
}

// ==================== ACTIVITY LOG ====================

export async function createActivityLog(data: {
  type: string
  description: string
  userId?: string
  userName?: string
  metadata?: Record<string, any>
}) {
  await connectToDatabase()
  const doc = await ActivityLog.create({
    ...data,
    createdAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function getActivityLogs(limitCount: number = 20) {
  await connectToDatabase()
  const docs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(limitCount)
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getDetailedAuditLogs(filters?: {
  userId?: string
  type?: string
  startDate?: string
  endDate?: string
  limitCount?: number
}) {
  await connectToDatabase()
  const filter: any = {}

  if (filters?.userId) filter.userId = filters.userId
  if (filters?.type) filter.type = filters.type

  if (filters?.startDate || filters?.endDate) {
    filter.createdAt = {}
    if (filters.startDate) filter.createdAt.$gte = new Date(filters.startDate)
    if (filters.endDate) filter.createdAt.$lte = new Date(filters.endDate)
  }

  const docs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(filters?.limitCount || 100)
    .lean()

  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function exportAuditLogs(format: string = 'json') {
  await connectToDatabase()
  const docs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getSubAdminActivityLogs(subAdminId: string) {
  await connectToDatabase()
  const docs = await ActivityLog.find({ userId: subAdminId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

// ==================== CHAT SYSTEM ====================

export async function getChatMessages(requestId: string, limitCount: number = 50) {
  await connectToDatabase()
  const docs = await Chat.find({ requestId })
    .sort({ createdAt: 1 })
    .limit(limitCount)
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function sendChatMessage(data: {
  requestId: string
  senderId: string
  senderName: string
  senderType: 'nurse' | 'beneficiary' | 'admin'
  message: string
}) {
  await connectToDatabase()
  const doc = await Chat.create({
    ...data,
    createdAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function deleteChatMessages(requestId: string) {
  await connectToDatabase()
  const result = await Chat.deleteMany({ requestId })
  return { deletedCount: result.deletedCount }
}

// ==================== COUPONS ====================

export async function createCoupon(data: {
  code: string
  discountPercent: number
  maxUses: number
  expiresAt: string
  isActive: boolean
}) {
  await connectToDatabase()
  const doc = await Coupon.create({
    ...data,
    usedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, usedCount: 0 }
}

export async function getAllCoupons() {
  await connectToDatabase()
  const docs = await Coupon.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getCouponById(id: string) {
  await connectToDatabase()
  const doc = await Coupon.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function updateCoupon(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Coupon.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Coupon.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function deleteCoupon(id: string) {
  await connectToDatabase()
  await Coupon.findByIdAndDelete(id)
}

export async function validateCoupon(code: string) {
  await connectToDatabase()
  const doc = await Coupon.findOne({ code, isActive: true }).lean()
  if (!doc) return null

  const coupon = convertTimestamps(docToObject(doc))

  if (!coupon.isActive) return null

  const now = new Date()
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return null
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return null

  return coupon
}

export async function incrementCouponUsage(couponId: string) {
  await connectToDatabase()
  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { usedCount: 1 },
    updatedAt: new Date(),
  })
}

// ==================== LOYALTY PROGRAM ====================

export async function getLoyaltyPoints(beneficiaryId: string) {
  await connectToDatabase()
  const docs = await LoyaltyPoint.find({ beneficiaryId })
    .sort({ createdAt: -1 })
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function addLoyaltyPoints(beneficiaryId: string, points: number, reason: string) {
  await connectToDatabase()
  const doc = await LoyaltyPoint.create({
    beneficiaryId,
    points,
    reason,
    type: 'earn',
    createdAt: new Date(),
  })
  const obj = docToObject(doc)

  // Update beneficiary total points atomically using $inc
  await Beneficiary.findByIdAndUpdate(beneficiaryId, {
    $inc: { loyaltyPoints: points },
    updatedAt: new Date(),
  })

  return { id: obj.id, beneficiaryId, points, reason, type: 'earn' as const }
}

export async function redeemLoyaltyPoints(beneficiaryId: string, points: number) {
  await connectToDatabase()

  // Use Mongoose session for atomic read-check-write
  const session = await mongoose.startSession()
  try {
    let result: any = null

    await session.withTransaction(async () => {
      const benefDoc = await Beneficiary.findById(beneficiaryId).session(session)
      if (!benefDoc) throw new Error('المستفيد غير موجود')

      const currentPoints = benefDoc.loyaltyPoints || 0
      if (currentPoints < points) throw new Error('رصيد النقاط غير كافٍ')

      // Add redemption record
      const [loyaltyDoc] = await LoyaltyPoint.create([{
        beneficiaryId,
        points: -points,
        reason: `استبدال ${points} نقطة`,
        type: 'redeem',
        createdAt: new Date(),
      }], { session })

      // Update beneficiary points atomically
      benefDoc.loyaltyPoints = currentPoints - points
      benefDoc.updatedAt = new Date()
      await benefDoc.save({ session })

      result = { id: docToObject(loyaltyDoc).id, beneficiaryId, points: -points, reason: `استبدال ${points} نقطة`, type: 'redeem' as const }
    })

    return result
  } finally {
    await session.endSession()
  }
}

export async function getLoyaltyBalance(beneficiaryId: string) {
  await connectToDatabase()
  const doc = await Beneficiary.findById(beneficiaryId).lean()
  if (!doc) return 0
  return doc.loyaltyPoints || 0
}

// ==================== EMERGENCY REQUESTS ====================

export async function createEmergencyRequest(data: {
  beneficiaryId: string
  serviceType: string
  address: string
  notes?: string
  price?: number
  dynamicPrice?: number
  pricingBreakdown?: Record<string, any>
  commission?: Record<string, any>
  paymentMethod?: string | null
  paymentMethodId?: string | null
  paymentStatus?: string
  status?: string
}) {
  await connectToDatabase()
  const benefDoc = await Beneficiary.findById(data.beneficiaryId).lean()
  const beneficiaryName = benefDoc ? benefDoc.name : 'غير معروف'

  const { status: providedStatus, paymentStatus, ...restData } = data
  const finalStatus = providedStatus || 'pending'

  // Filter out undefined values
  const cleanData: Record<string, any> = {}
  for (const [key, value] of Object.entries(restData)) {
    if (value !== undefined) {
      cleanData[key] = value
    }
  }

  const doc = await EmergencyRequest.create({
    ...cleanData,
    beneficiaryName,
    status: finalStatus,
    paymentStatus: paymentStatus || 'unpaid',
    isEmergency: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...cleanData, beneficiaryName, status: finalStatus, paymentStatus: paymentStatus || 'unpaid', isEmergency: true }
}

export async function getEmergencyRequestsByBeneficiary(beneficiaryId: string) {
  await connectToDatabase()
  const docs = await EmergencyRequest.find({ beneficiaryId })
    .sort({ createdAt: -1 })
    .lean()

  const requests: any[] = []
  for (const doc of docs) {
    const data = convertTimestamps(docToObject(doc))

    const assignDoc = await EmergencyAssignment.findOne({ emergencyRequestId: data.id }).lean()

    let assignment = null
    if (assignDoc) {
      const assignData = convertTimestamps(docToObject(assignDoc))
      const nurseDoc = await Nurse.findById(assignData.nurseId).lean()
      assignment = {
        id: assignData.id,
        ...assignData,
        nurse: nurseDoc
          ? {
              id: docToObject(nurseDoc).id,
              firstName: nurseDoc.firstName,
              lastName: nurseDoc.lastName,
              phone: nurseDoc.phone || null,
            }
          : null,
      }
    }

    requests.push({
      id: data.id,
      ...data,
      assignment,
    })
  }

  return requests
}

export async function getEmergencyRequests() {
  await connectToDatabase()
  const docs = await EmergencyRequest.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function updateEmergencyRequest(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await EmergencyRequest.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await EmergencyRequest.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getEmergencyRequestById(id: string) {
  await connectToDatabase()
  const doc = await EmergencyRequest.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== EMERGENCY ASSIGNMENTS ====================

export async function createEmergencyAssignment(data: {
  emergencyRequestId: string
  nurseId: string
  status: string
}) {
  await connectToDatabase()
  const doc = await EmergencyAssignment.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)

  const nurseDoc = await Nurse.findById(data.nurseId).lean()
  return {
    id: obj.id,
    ...data,
    nurse: nurseDoc
      ? { id: docToObject(nurseDoc).id, firstName: nurseDoc.firstName, lastName: nurseDoc.lastName, phone: nurseDoc.phone || null }
      : null,
  }
}

// ==================== REFERRAL SYSTEM ====================

export async function generateReferralCode(beneficiaryId: string) {
  await connectToDatabase()
  const existing = await Referral.findOne({ beneficiaryId }).lean()
  if (existing) {
    return convertTimestamps(docToObject(existing))
  }

  const code = 'AFY-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  const doc = await Referral.create({
    beneficiaryId,
    code,
    uses: 0,
    createdAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, beneficiaryId, code, uses: 0 }
}

export async function applyReferralCode(code: string, newBeneficiaryId: string) {
  await connectToDatabase()
  const doc = await Referral.findOne({ code }).lean()
  if (!doc) return null

  const referral = convertTimestamps(docToObject(doc))

  if (referral.beneficiaryId === newBeneficiaryId) {
    throw new Error('لا يمكنك استخدام كود الإحالة الخاص بك')
  }

  // Increment uses using $inc
  await Referral.findByIdAndUpdate(referral.id, { $inc: { uses: 1 } })

  // Give both parties loyalty points
  await addLoyaltyPoints(referral.beneficiaryId, 50, 'مكافأة إحالة - شخص جديد استخدم كودك')
  await addLoyaltyPoints(newBeneficiaryId, 25, 'مكافأة إحالة - استخدمت كود إحالة')

  return { ...referral, uses: referral.uses + 1 }
}

export async function getReferralByBeneficiary(beneficiaryId: string) {
  await connectToDatabase()
  const doc = await Referral.findOne({ beneficiaryId }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== RATINGS ====================

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
  await connectToDatabase()
  const doc = await Rating.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function getNurseRatings(nurseId: string) {
  await connectToDatabase()
  const docs = await Rating.find({ nurseId }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getAllRatings() {
  await connectToDatabase()
  const docs = await Rating.find().sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getRatingsByUser(userId: string, userType: string) {
  await connectToDatabase()
  const filter = userType === 'nurse'
    ? { toUserId: userId, toUserType: userType }
    : { fromUserId: userId, fromUserType: userType }
  const docs = await Rating.find(filter).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getRatingByRequestId(requestId: string) {
  await connectToDatabase()
  const doc = await Rating.findOne({ requestId }).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function replyToRating(ratingId: string, reply: string) {
  await connectToDatabase()
  await Rating.findByIdAndUpdate(ratingId, {
    reply,
    replyCreatedAt: new Date(),
    updatedAt: new Date(),
  })
  const doc = await Rating.findById(ratingId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function createEnhancedRating(data: {
  requestId: string
  nurseId: string
  beneficiaryId: string
  beneficiaryName: string
  nurseName: string
  serviceName: string
  criteria: {
    punctuality: number
    professionalism: number
    cleanliness: number
    communication: number
  }
  overallRating: number
  comment?: string
  beforePhotos?: string[]
  afterPhotos?: string[]
}) {
  await connectToDatabase()
  const doc = await Rating.create({
    ...data,
    rating: data.overallRating,
    nurseReply: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function addNurseReplyToRating(ratingId: string, nurseId: string, reply: string) {
  await connectToDatabase()
  await Rating.findByIdAndUpdate(ratingId, {
    nurseReply: { text: reply, createdAt: new Date() },
    updatedAt: new Date(),
  })
  const doc = await Rating.findById(ratingId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== ADMIN SETTINGS ====================

export async function getAdminSettings(subAdminId?: string) {
  await connectToDatabase()
  const docId = subAdminId ? `sub-admin-${subAdminId}` : 'admin'
  const doc = await AppSetting.findById(docId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function updateAdminSettings(data: Record<string, any>, subAdminId?: string) {
  await connectToDatabase()
  const docId = subAdminId ? `sub-admin-${subAdminId}` : 'admin'
  await AppSetting.findByIdAndUpdate(docId, {
    ...data,
    updatedAt: new Date(),
  }, { upsert: true, new: true, setDefaultsOnInsert: true })
  const doc = await AppSetting.findById(docId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== FCM TOKENS ====================

export async function saveFcmToken(data: {
  userId: string
  userType: string
  token: string
  deviceInfo?: Record<string, any>
}) {
  await connectToDatabase()
  const doc = await FcmToken.findOneAndUpdate(
    { userId: data.userId, userType: data.userType, token: data.token },
    {
      ...data,
      isActive: true,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()
  return convertTimestamps(docToObject(doc))
}

export async function deactivateFcmToken(token: string) {
  await connectToDatabase()
  await FcmToken.updateMany({ token }, { isActive: false, updatedAt: new Date() })
}

export async function getFcmTokensByUser(userId: string, userType: string) {
  await connectToDatabase()
  const docs = await FcmToken.find({ userId, userType, isActive: true }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

// ==================== PUSH NOTIFICATIONS ====================

export async function createPushNotification(data: {
  userId: string
  userType: 'nurse' | 'beneficiary' | 'admin'
  title: string
  message: string
  type: string
  data?: Record<string, any>
}) {
  await connectToDatabase()
  const doc = await PushNotification.create({
    ...data,
    read: false,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, read: false }
}

export async function getNotificationsByUser(userId: string, userType: string, limitCount: number = 50) {
  await connectToDatabase()
  const docs = await PushNotification.find({ userId, userType })
    .sort({ createdAt: -1 })
    .limit(limitCount)
    .lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getUserNotifications(userId: string, userType: string, limitCount: number = 50) {
  return getNotificationsByUser(userId, userType, limitCount)
}

export async function markNotificationAsRead(notificationId: string) {
  await connectToDatabase()
  await PushNotification.findByIdAndUpdate(notificationId, {
    read: true,
    isRead: true,
    updatedAt: new Date(),
  })
}

export async function markNotificationRead(notificationId: string) {
  return markNotificationAsRead(notificationId)
}

export async function markAllNotificationsAsRead(userId: string, userType: string) {
  await connectToDatabase()
  await PushNotification.updateMany(
    { userId, userType, read: { $ne: true } },
    { read: true, isRead: true, updatedAt: new Date() }
  )
}

export async function getUnreadNotificationCount(userId: string, userType: string) {
  await connectToDatabase()
  return PushNotification.countDocuments({ userId, userType, read: { $ne: true } })
}

// ==================== WHATSAPP ====================

export async function queueWhatsAppMessage(data: {
  phone: string
  message: string
  type: string
  userId?: string
}) {
  await connectToDatabase()
  const doc = await WhatsappQueue.create({
    ...data,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, status: 'pending' }
}

// ==================== DASHBOARD STATS ====================

export async function getAdminDashboardStats() {
  await connectToDatabase()
  const [
    totalNurses,
    pendingNurses,
    totalBeneficiaries,
    totalServiceRequests,
    pendingRequests,
    completedRequests,
    totalServices,
    activeServices,
    totalRevenue,
  ] = await Promise.all([
    Nurse.countDocuments(),
    Nurse.countDocuments({ status: 'pending' }),
    Beneficiary.countDocuments(),
    ServiceRequest.countDocuments(),
    ServiceRequest.countDocuments({ status: 'pending' }),
    ServiceRequest.countDocuments({ status: 'completed' }),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true }),
    getCompletedServiceRevenue(),
  ])

  return {
    totalNurses,
    pendingNurses,
    totalBeneficiaries,
    totalServiceRequests,
    pendingRequests,
    completedRequests,
    totalServices,
    activeServices,
    totalRevenue,
  }
}

// ==================== NURSE PORTFOLIO ====================

export async function updateNursePortfolio(id: string, portfolio: {
  bio?: string
  experience?: number
  specializations?: string[]
  certifications?: string[]
  workPhotos?: string[]
  completedCases?: number
}) {
  await connectToDatabase()
  await Nurse.findByIdAndUpdate(id, { portfolio, updatedAt: new Date() })
  const doc = await Nurse.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== NURSE LIVE LOCATION ====================

export async function updateNurseLocation(nurseId: string, latitude: number, longitude: number) {
  await connectToDatabase()
  await Nurse.findByIdAndUpdate(nurseId, {
    currentLocation: { latitude, longitude, updatedAt: new Date() },
    updatedAt: new Date(),
  })
  const doc = await Nurse.findById(nurseId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function getNurseLocation(nurseId: string) {
  await connectToDatabase()
  const doc = await Nurse.findById(nurseId).lean()
  if (!doc) return null
  return doc.currentLocation || null
}

// ==================== APPOINTMENTS ====================

export async function createAppointment(data: {
  beneficiaryId: string
  serviceId: string
  nurseId?: string
  date: string
  time: string
  notes?: string
}) {
  await connectToDatabase()
  const doc = await Appointment.create({
    ...data,
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, status: 'scheduled' }
}

export async function getAppointmentsByBeneficiary(beneficiaryId: string) {
  await connectToDatabase()
  const docs = await Appointment.find({ beneficiaryId }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getAppointmentsByNurse(nurseId: string) {
  await connectToDatabase()
  const docs = await Appointment.find({ nurseId }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function getAppointmentById(id: string) {
  await connectToDatabase()
  const doc = await Appointment.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function updateAppointment(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Appointment.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Appointment.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function deleteAppointment(id: string) {
  await connectToDatabase()
  await Appointment.findByIdAndDelete(id)
}

// ==================== REPORTS / COMPLAINTS ====================

export async function createReport(data: {
  reporterId: string
  reporterType: 'beneficiary' | 'nurse'
  reportedId: string
  reportedType: 'nurse' | 'beneficiary'
  type: string
  description: string
  images?: string[]
}) {
  await connectToDatabase()
  const doc = await Report.create({
    ...data,
    status: 'open',
    adminResponse: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data, status: 'open' }
}

export async function getReports(status?: string) {
  await connectToDatabase()
  const filter: any = {}
  if (status) filter.status = status
  const docs = await Report.find(filter).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function updateReport(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Report.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Report.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== PAYMENT TRANSACTIONS ====================

export async function createTransaction(data: {
  requestId: string
  beneficiaryId: string
  amount: number
  paymentMethod: string
  transactionRef?: string
  status: string
}) {
  await connectToDatabase()
  const doc = await Transaction.create({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const obj = docToObject(doc)
  return { id: obj.id, ...data }
}

export async function getTransactionsByBeneficiary(beneficiaryId: string) {
  await connectToDatabase()
  const docs = await Transaction.find({ beneficiaryId }).sort({ createdAt: -1 }).lean()
  return docs.map((doc: any) => convertTimestamps(docToObject(doc)))
}

export async function updateTransaction(id: string, data: Record<string, any>) {
  await connectToDatabase()
  await Transaction.findByIdAndUpdate(id, { ...data, updatedAt: new Date() })
  const doc = await Transaction.findById(id).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

// ==================== FAVORITE NURSE (FAMILY DOCTOR) ====================

export async function setFavoriteNurse(beneficiaryId: string, nurseId: string) {
  await connectToDatabase()
  await Beneficiary.findByIdAndUpdate(beneficiaryId, {
    favoriteNurseId: nurseId,
    updatedAt: new Date(),
  })
  const doc = await Beneficiary.findById(beneficiaryId).lean()
  if (!doc) return null
  return convertTimestamps(docToObject(doc))
}

export async function removeFavoriteNurse(beneficiaryId: string) {
  await connectToDatabase()
  // Use $unset to remove the field (equivalent to FieldValue.delete())
  await Beneficiary.findByIdAndUpdate(beneficiaryId, {
    $unset: { favoriteNurseId: '' },
    updatedAt: new Date(),
  })
}

export async function getFavoriteNurse(beneficiaryId: string) {
  await connectToDatabase()
  const doc = await Beneficiary.findById(beneficiaryId).lean()
  if (!doc) return null
  const favoriteNurseId = doc.favoriteNurseId
  if (!favoriteNurseId) return null
  const nurseDoc = await Nurse.findById(favoriteNurseId).lean()
  if (!nurseDoc) return null
  const { password, ...nurseData } = nurseDoc
  return { id: docToObject(nurseDoc).id, ...nurseData }
}

// ==================== NURSE EARNINGS ====================

export async function getNurseEarnings(nurseId: string, period?: 'week' | 'month') {
  await connectToDatabase()
  const now = new Date()
  const periodStart = period === 'week'
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getFullYear(), now.getMonth(), 1)

  const assignmentDocs = await ServiceAssignment.find({
    nurseId,
    status: 'completed',
  }).lean()

  let totalEarnings = 0
  const assignments: any[] = []

  for (const doc of assignmentDocs) {
    const data = docToObject(doc)
    const assignDate = data.updatedAt ? new Date(data.updatedAt) : null

    if (assignDate && assignDate >= periodStart) {
      const requestDoc = await ServiceRequest.findById(data.requestId).lean()
      if (requestDoc) {
        const serviceDoc = await Service.findById(requestDoc.serviceId).lean()
        if (serviceDoc) {
          const price = serviceDoc.price || 0
          totalEarnings += price
          assignments.push({
            id: data.id,
            ...data,
            service: { name: serviceDoc.name, price },
          })
        }
      }
    }
  }

  return { totalEarnings, assignments, period }
}

// ==================== DYNAMIC PRICING ====================

export async function calculateDynamicPrice(serviceId: string, hour?: number, distanceKm?: number) {
  await connectToDatabase()
  const serviceDoc = await Service.findById(serviceId).lean()
  if (!serviceDoc) throw new Error('الخدمة غير موجودة')

  let basePrice = serviceDoc.price || 0

  const currentHour = hour ?? new Date().getHours()
  const timeMultiplier = (currentHour >= 22 || currentHour < 6) ? 1.3 : 1.0

  let distanceSurcharge = 0
  if (distanceKm && distanceKm > 5) {
    distanceSurcharge = basePrice * 0.05 * (distanceKm - 5)
  }

  const finalPrice = Math.round(basePrice * timeMultiplier + distanceSurcharge)

  return {
    basePrice,
    timeMultiplier,
    distanceSurcharge: Math.round(distanceSurcharge),
    finalPrice,
    breakdown: {
      base: basePrice,
      nightFee: Math.round(basePrice * (timeMultiplier - 1)),
      distanceFee: Math.round(distanceSurcharge),
    }
  }
}

// ==================== SEARCH ====================

export async function searchNurses(query: string, specialization?: string) {
  await connectToDatabase()
  const filter: any = { status: 'approved' }

  if (query) {
    filter.$or = [
      { firstName: { $regex: query, $options: 'i' } },
      { secondName: { $regex: query, $options: 'i' } },
      { thirdName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { 'portfolio.specializations': { $regex: query, $options: 'i' } },
    ]
  }

  if (specialization) {
    filter['portfolio.specializations'] = { $regex: specialization, $options: 'i' }
  }

  const docs = await Nurse.find(filter).lean()
  return docs.map((doc: any) => {
    const obj = convertTimestamps(docToObject(doc))
    const { password, ...rest } = obj
    return rest
  })
}
