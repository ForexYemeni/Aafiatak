import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const nurseId = searchParams.get('nurseId');
    const period = searchParams.get('period') || '30';
    const days = parseInt(period);

    const db = mongoose.connection.db;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    if (type === 'nurse' && nurseId) {
      const services = await db.collection('requests')
        .find({ nurseId, createdAt: { $gte: startDate } })
        .toArray();

      const completed = services.filter((s: any) => s.status === 'completed').length;
      const revenue = services
        .filter((s: any) => s.status === 'completed')
        .reduce((sum: number, s: any) => sum + (s.price || 0), 0);

      const dailyData = await db.collection('requests')
        .aggregate([
          { $match: { nurseId, createdAt: { $gte: startDate } } },
          { 
            $group: { 
              _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
              count: { $sum: 1 },
              revenue: { $sum: '$price' }
            }
          },
          { $sort: { _id: 1 } }
        ])
        .toArray();

      return NextResponse.json({
        success: true,
        data: {
          totalServices: services.length,
          completed,
          revenue,
          completionRate: services.length ? ((completed / services.length) * 100).toFixed(1) : 0,
          dailyData,
        }
      });
    }

    if (type === 'admin') {
      const [totalRequests, totalNurses, totalBeneficiaries, revenueData] = await Promise.all([
        db.collection('requests').countDocuments({ createdAt: { $gte: startDate } }),
        db.collection('nurses').countDocuments({}),
        db.collection('beneficiaries').countDocuments({}),
        db.collection('requests').aggregate([
          { $match: { status: 'completed', createdAt: { $gte: startDate } } },
          { $group: { _id: null, total: { $sum: '$price' } } }
        ]).toArray(),
      ]);

      const topServices = await db.collection('requests').aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      const topNurses = await db.collection('requests').aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: '$nurseId', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]).toArray();

      return NextResponse.json({
        success: true,
        data: {
          totalRequests,
          totalNurses,
          totalBeneficiaries,
          totalRevenue: revenueData[0]?.total || 0,
          topServices,
          topNurses,
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Analytics type required' }, { status: 400 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}