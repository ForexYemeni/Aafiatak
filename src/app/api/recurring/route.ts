import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

interface RecurringBooking {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  serviceId: string;
  nurseId?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  address: string;
  notes?: string;
  discount: number;
  isActive: boolean;
  nextDate: Date;
  lastBookedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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
    const role = searchParams.get('role');

    const db = mongoose.connection.db;
    
    if (role === 'admin') {
      const bookings = await db.collection('recurringbookings').find({}).toArray();
      return NextResponse.json({ success: true, data: bookings });
    }

    if (userId) {
      const bookings = await db.collection('recurringbookings').find({ userId, isActive: true }).toArray();
      return NextResponse.json({ success: true, data: bookings });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Recurring bookings error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, serviceId, frequency, dayOfWeek, dayOfMonth, time, address, notes, nurseId } = body;

    if (!userId || !serviceId || !frequency || !time || !address) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const discount = frequency === 'monthly' ? 15 : frequency === 'biweekly' ? 10 : 5;
    
    const nextDate = new Date();
    if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'biweekly') {
      nextDate.setDate(nextDate.getDate() + 14);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const booking: RecurringBooking = {
      userId,
      serviceId,
      nurseId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      address,
      notes,
      discount,
      isActive: true,
      nextDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = mongoose.connection.db;
    const result = await db.collection('recurringbookings').insertOne(booking);

    return NextResponse.json({ 
      success: true, 
      data: { ...booking, _id: result.insertedId },
      message: `Recurring ${frequency} booking created with ${discount}% discount!`
    });
  } catch (error) {
    console.error('Create recurring booking error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { bookingId, isActive, nurseId } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });
    }

    const db = mongoose.connection.db;
    const updateFields: any = { updatedAt: new Date() };
    
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;
    if (nurseId) updateFields.nurseId = nurseId;

    await db.collection('recurringbookings').updateOne(
      { _id: new mongoose.Types.ObjectId(bookingId) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: 'Booking updated' });
  } catch (error) {
    console.error('Update recurring booking error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 });
    }

    const db = mongoose.connection.db;
    await db.collection('recurringbookings').updateOne(
      { _id: new mongoose.Types.ObjectId(bookingId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    console.error('Delete recurring booking error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}