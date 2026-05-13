import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

interface HealthRecord {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  date: Date;
  metrics: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    bloodSugar?: number;
    oxygenLevel?: number;
  };
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    takenAt?: Date;
  }[];
  notes?: string;
  createdAt: Date;
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const db = mongoose.connection.db;
    const records = await db.collection('healthrecords')
      .find({ userId, date: { $gte: startDate } })
      .sort({ date: -1 })
      .toArray();

    const summary = records.reduce((acc: any, record: any) => {
      if (record.metrics?.bloodPressure) {
        acc.bpHistory = acc.bpHistory || [];
        acc.bpHistory.push(record.metrics.bloodPressure);
      }
      if (record.metrics?.heartRate) {
        acc.hrHistory = acc.hrHistory || [];
        acc.hrHistory.push(record.metrics.heartRate);
      }
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: records, summary });
  } catch (error) {
    console.error('Health records error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, metrics, medications, notes } = body;

    if (!userId || !metrics) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const record: HealthRecord = {
      userId,
      date: new Date(),
      metrics,
      medications,
      notes,
      createdAt: new Date(),
    };

    const db = mongoose.connection.db;
    const result = await db.collection('healthrecords').insertOne(record);

    return NextResponse.json({ 
      success: true, 
      data: { ...record, _id: result.insertedId },
      message: 'Health record saved!'
    });
  } catch (error) {
    console.error('Save health record error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { recordId, medicationTaken } = body;

    if (!recordId) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });
    }

    const db = mongoose.connection.db;
    
    if (medicationTaken) {
      await db.collection('healthrecords').updateOne(
        { _id: new mongoose.Types.ObjectId(recordId), 'medications.name': medicationTaken.name },
        { $set: { 'medications.$.takenAt': new Date() } }
      );
    }

    return NextResponse.json({ success: true, message: 'Medication logged!' });
  } catch (error) {
    console.error('Update health record error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}