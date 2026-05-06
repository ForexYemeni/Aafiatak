import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, password } = body

    if (!adminId || !password) {
      return NextResponse.json({ error: 'معرف المدير وكلمة المرور مطلوبان' }, { status: 400 })
    }

    await connectToDatabase()
    const Admin = mongoose.models.Admin

    // Verify admin exists and password is correct
    const adminDoc = Admin ? await Admin.findById(adminId).lean() : null
    if (!adminDoc) {
      return NextResponse.json({ error: 'حساب المدير غير موجود' }, { status: 404 })
    }

    const isValidPassword = await bcrypt.compare(password, adminDoc.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Collections to delete (all except 'admins')
    const collectionsToDelete: Record<string, any> = {
      nurses: mongoose.models.Nurse,
      beneficiaries: mongoose.models.Beneficiary,
      serviceRequests: mongoose.models.ServiceRequest,
      serviceAssignments: mongoose.models.ServiceAssignment,
      services: mongoose.models.Service,
      paymentMethods: mongoose.models.PaymentMethod,
      coupons: mongoose.models.Coupon,
      ratings: mongoose.models.Rating,
      activityLog: mongoose.models.ActivityLog,
      emergencyRequests: mongoose.models.EmergencyRequest,
      emergencyAssignments: mongoose.models.EmergencyAssignment,
      subAdmins: mongoose.models.SubAdmin,
      chats: mongoose.models.Chat,
      loyaltyPoints: mongoose.models.LoyaltyPoint,
      referrals: mongoose.models.Referral,
      reports: mongoose.models.Report,
      transactions: mongoose.models.Transaction,
      appointments: mongoose.models.Appointment,
      pushNotifications: mongoose.models.PushNotification,
      fcmtokens: mongoose.models.FcmToken,
      whatsappQueue: mongoose.models.WhatsappQueue,
    }

    const results: Record<string, number> = {}
    let totalDeleted = 0

    for (const [collectionName, model] of Object.entries(collectionsToDelete)) {
      try {
        if (model) {
          const deleteResult = await model.deleteMany({})
          results[collectionName] = deleteResult.deletedCount
          totalDeleted += deleteResult.deletedCount
        } else {
          results[collectionName] = 0
        }
      } catch (err: any) {
        results[collectionName] = -1 // Error marker
        console.error(`Error deleting collection ${collectionName}:`, err.message)
      }
    }

    // Reset app settings
    try {
      const AppSetting = mongoose.models.AppSetting
      if (AppSetting) {
        await AppSetting.findByIdAndUpdate('admin', {
          emergencyPhone: '',
          referralBonusPoints: 50,
          referralBonusPointsReceiver: 25,
          referralEnabled: true,
          updatedAt: new Date(),
        }, { upsert: true, new: true, setDefaultsOnInsert: true })
      }
    } catch (err: any) {
      console.error('Error resetting settings:', err.message)
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف جميع البيانات بنجاح. إجمالي المستندات المحذوفة: ${totalDeleted}`,
      details: results,
      totalDeleted,
    })
  } catch (error: any) {
    console.error('Reset data error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في حذف البيانات' }, { status: 500 })
  }
}
