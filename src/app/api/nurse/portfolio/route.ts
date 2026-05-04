import { NextRequest, NextResponse } from 'next/server'
import { getNurseById, updateNurse } from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nurseId = searchParams.get('nurseId')

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    const nurse = await getNurseById(nurseId)
    if (!nurse) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Return only portfolio-related fields
    const portfolio = {
      bio: (nurse as any).portfolio?.bio || '',
      experience: (nurse as any).portfolio?.experience || '',
      specializations: (nurse as any).portfolio?.specializations || [],
      certifications: (nurse as any).portfolio?.certifications || [],
      workPhotos: (nurse as any).portfolio?.workPhotos || [],
    }

    return NextResponse.json({ nurseId, portfolio })
  } catch (error: any) {
    console.error('Get nurse portfolio error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { nurseId, portfolio } = body

    if (!nurseId) {
      return NextResponse.json({ error: 'معرف الممرض مطلوب' }, { status: 400 })
    }

    if (!portfolio) {
      return NextResponse.json({ error: 'بيانات الملف الشخصي مطلوبة' }, { status: 400 })
    }

    const existing = await getNurseById(nurseId)
    if (!existing) {
      return NextResponse.json({ error: 'الممرض غير موجود' }, { status: 404 })
    }

    // Build portfolio object with allowed fields
    const portfolioData: Record<string, any> = {}
    if (portfolio.bio !== undefined) portfolioData.bio = portfolio.bio
    if (portfolio.experience !== undefined) portfolioData.experience = portfolio.experience
    if (portfolio.specializations !== undefined) portfolioData.specializations = portfolio.specializations
    if (portfolio.certifications !== undefined) portfolioData.certifications = portfolio.certifications
    if (portfolio.workPhotos !== undefined) portfolioData.workPhotos = portfolio.workPhotos

    const updated = await updateNurse(nurseId, { portfolio: portfolioData })

    // Remove password from response
    const { password, ...safeNurse } = updated as any

    return NextResponse.json({ nurseId, portfolio: safeNurse.portfolio || portfolioData })
  } catch (error: any) {
    console.error('Update nurse portfolio error:', error.message)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
