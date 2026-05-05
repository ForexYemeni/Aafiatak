import { NextRequest, NextResponse } from 'next/server'
import { createReport } from '@/lib/firestore'
import { connectToDatabase } from '@/lib/mongodb'
import { mongoose } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporterId, reporterType, reportedId, reportedType, type, description, images, requestId, serviceName } = body

    if (!reporterId || !reporterType || !type || !description) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 })
    }

    const validReporterTypes = ['beneficiary', 'nurse']
    const validReportedTypes = ['beneficiary', 'nurse', 'service']
    const validTypes = ['complaint', 'misconduct', 'no-show', 'late', 'quality', 'other']

    if (!validReporterTypes.includes(reporterType)) {
      return NextResponse.json({ error: 'نوع المبلغ غير صالح' }, { status: 400 })
    }
    if (reportedType && !validReportedTypes.includes(reportedType)) {
      return NextResponse.json({ error: 'نوع المبلغ عنه غير صالح' }, { status: 400 })
    }
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع البلاغ غير صالح' }, { status: 400 })
    }

    // Fetch reporter name
    let reporterName = 'غير معروف'
    await connectToDatabase()
    const reporterCollection = reporterType === 'beneficiary' ? mongoose.models.Beneficiary : mongoose.models.Nurse
    if (reporterCollection) {
      const reporterDoc = await reporterCollection.findById(reporterId).lean()
      if (reporterDoc) {
        reporterName = reporterDoc.name || `${reporterDoc.firstName || ''} ${reporterDoc.lastName || ''}`.trim()
      }
    }

    // Fetch reported entity name
    let reportedName = 'غير محدد'
    if (reportedId && reportedType && reportedId !== 'general') {
      const reportedCollectionName = reportedType === 'beneficiary' ? 'Beneficiary' : reportedType === 'nurse' ? 'Nurse' : 'Service'
      const reportedCollection = mongoose.models[reportedCollectionName]
      if (reportedCollection) {
        const reportedDoc = await reportedCollection.findById(reportedId).lean()
        if (reportedDoc) {
          reportedName = reportedDoc.name || `${reportedDoc.firstName || ''} ${reportedDoc.lastName || ''}`.trim()
        }
      }
    }

    const report = await createReport({
      reporterId,
      reporterType,
      reportedId: reportedId || 'general',
      reportedType: reportedType || 'general',
      type,
      description,
      images: images || [],
    })

    // Add extra fields that createReport doesn't cover
    await connectToDatabase()
    const Report = mongoose.models.Report
    await Report.findByIdAndUpdate(report.id, {
      reporterName,
      reportedName,
      requestId: requestId || null,
      serviceName: serviceName || null,
      adminNotes: null,
      resolvedAt: null,
      resolvedBy: null,
    })

    return NextResponse.json({
      id: report.id,
      reporterId,
      reporterType,
      reporterName,
      reportedId: reportedId || null,
      reportedType: reportedType || null,
      reportedName,
      requestId: requestId || null,
      serviceName: serviceName || null,
      type,
      description,
      images: images || [],
      status: 'pending',
      adminNotes: null,
      adminResponse: null,
      resolvedAt: null,
      resolvedBy: null,
      message: 'تم إنشاء البلاغ بنجاح',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create report error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
