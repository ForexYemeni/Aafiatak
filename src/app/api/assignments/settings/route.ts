import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

interface AssignmentSettings {
  _id: mongoose.Types.ObjectId;
  adminFeePercent: number;
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
  updatedAt: Date;
}

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    
    let settings = await db.collection('assignmentsettings').findOne({});
    
    if (!settings) {
      const defaultSettings: AssignmentSettings = {
        _id: new mongoose.Types.ObjectId(),
        adminFeePercent: 10,
        minAmount: 5000,
        maxAmount: 50000,
        enabled: true,
        updatedAt: new Date(),
      };
      
      await db.collection('assignmentsettings').insertOne(defaultSettings);
      settings = defaultSettings;
    }
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { adminFeePercent, minAmount, maxAmount, enabled } = body;
    
    const db = mongoose.connection.db;
    
    const updateFields: any = { updatedAt: new Date() };
    if (typeof adminFeePercent === 'number') updateFields.adminFeePercent = adminFeePercent;
    if (typeof minAmount === 'number') updateFields.minAmount = minAmount;
    if (typeof maxAmount === 'number') updateFields.maxAmount = maxAmount;
    if (typeof enabled === 'boolean') updateFields.enabled = enabled;
    
    await db.collection('assignmentsettings').updateOne(
      {},
      { $set: updateFields },
      { upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated!',
      data: updateFields
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}