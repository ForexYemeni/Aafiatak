import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

// Types
export interface Assignment {
  _id: mongoose.Types.ObjectId;
  requesterId: string;
  requesterName: string;
  requesterRole: 'nurse' | 'beneficiary';
  // Assignment Details
  type: 'icu' | 'nursing' | 'emergency' | 'surgery' | 'care' | 'other';
  department: 'ICU' | 'Nursing' | 'Emergency' | 'Surgery' | 'Care' | 'Other';
  shiftHours: 8 | 12 | 16 | 24;
  gender: 'male' | 'female' | 'any';
  requirements: string;
  notes?: string;
  // Financial
  offeredAmount?: number;
  adminFee?: number;
  adminFeePercent?: number;
  // Status
  status: 'pending' | 'approved' | 'assigned' | 'completed' | 'cancelled' | 'paid';
  // Assigned Nurse
  assignedNurseId?: string;
  assignedNurseName?: string;
  assignedNursePhone?: string;
  // Payment
  paidAt?: Date;
  paymentMethod?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Settings interface
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

// GET - List assignments
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const db = mongoose.connection.db;
    let query: any = {};

    // Role-based filtering
    if (role === 'nurse') {
      query.$or = [
        { status: 'approved' },
        { status: 'paid', assignedNurseId: userId }
      ];
    } else if (role === 'beneficiary') {
      query.requesterId = userId;
    } else if (role === 'admin') {
      if (status) query.status = status;
      if (type) query.type = type;
    } else {
      query.status = 'approved';
    }

    if (userId && role !== 'admin') {
      if (role === 'nurse') {
        // Show available + assigned to this nurse
        query.$or = [
          { status: 'approved' },
          { assignedNurseId: userId }
        ];
      } else if (role === 'beneficiary') {
        query.requesterId = userId;
      }
    }

    const assignments = await db.collection('assignments')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      requesterId,
      requesterName,
      requesterRole,
      type,
      department,
      shiftHours,
      gender,
      requirements,
      notes,
      offeredAmount
    } = body;

    // Validation
    if (!requesterId || !requesterName || !type || !department || !shiftHours || !gender || !requirements) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = mongoose.connection.db;

    // Get settings
    const settings = await db.collection('assignmentsettings').findOne({}) as AssignmentSettings | null;
    const adminFeePercent = settings?.adminFeePercent || 10;
    const adminFee = offeredAmount ? Math.round(offeredAmount * adminFeePercent / 100) : 0;

    const assignment: Partial<Assignment> = {
      requesterId,
      requesterName,
      requesterRole,
      type,
      department,
      shiftHours,
      gender,
      requirements,
      notes,
      offeredAmount,
      adminFee,
      adminFeePercent,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('assignments').insertOne(assignment);

    return NextResponse.json({
      success: true,
      data: { ...assignment, _id: result.insertedId },
      message: 'Assignment created! Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Assignment POST error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update assignment
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { assignmentId, action, data } = body;

    if (!assignmentId || !action) {
      return NextResponse.json({ success: false, error: 'Assignment ID and action required' }, { status: 400 });
    }

    const db = mongoose.connection.db;
    const objectId = new mongoose.Types.ObjectId(assignmentId);

    switch (action) {
      case 'approve':
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { status: 'approved', updatedAt: new Date() } }
        );
        return NextResponse.json({ success: true, message: 'Assignment approved!' });

      case 'cancel':
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { status: 'cancelled', updatedAt: new Date() } }
        );
        return NextResponse.json({ success: true, message: 'Assignment cancelled!' });

      case 'assign':
        const { nurseId, nurseName, nursePhone } = data;
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { 
            assignedNurseId: nurseId,
            assignedNurseName: nurseName,
            assignedNursePhone: nursePhone,
            status: 'assigned',
            updatedAt: new Date()
          } }
        );
        return NextResponse.json({ success: true, message: 'Nurse assigned!' });

      case 'select':
        // Nurse selects the assignment
        const { nurseId: selNurseId, nurseName: selNurseName, nursePhone: selNursePhone } = data;
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { 
            assignedNurseId: selNurseId,
            assignedNurseName: selNurseName,
            assignedNursePhone: selNursePhone,
            status: 'paid',
            paidAt: new Date(),
            updatedAt: new Date()
          } }
        );
        return NextResponse.json({ success: true, message: 'You selected! Proceed to payment.' });

      case 'complete':
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { status: 'completed', updatedAt: new Date() } }
        );
        return NextResponse.json({ success: true, message: 'Assignment completed!' });

      case 'setAmount':
        const { offeredAmount } = data;
        const settings = await db.collection('assignmentsettings').findOne({}) as AssignmentSettings | null;
        const adminFeePercent = settings?.adminFeePercent || 10;
        const adminFee = Math.round(offeredAmount * adminFeePercent / 100);
        
        await db.collection('assignments').updateOne(
          { _id: objectId },
          { $set: { 
            offeredAmount,
            adminFee,
            adminFeePercent,
            status: 'approved',
            updatedAt: new Date()
          } }
        );
        return NextResponse.json({ 
          success: true, 
          data: { offeredAmount, adminFee },
          message: `Amount set! Admin fee (${adminFeePercent}%): ${adminFee}`
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assignment PUT error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}