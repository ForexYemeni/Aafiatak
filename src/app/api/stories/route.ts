import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aafiatak';

interface Story {
  _id?: mongoose.Types.ObjectId;
  nurseId: string;
  nurseName: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: 'recovery' | 'tips' | 'experience' | 'testimonial';
  beforeImage?: string;
  afterImage?: string;
  videoUrl?: string;
  likes: number;
  views: number;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  _id?: mongoose.Types.ObjectId;
  storyId: string;
  userId: string;
  userName: string;
  content: string;
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
    const nurseId = searchParams.get('nurseId');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const storyId = searchParams.get('storyId');

    const db = mongoose.connection.db;

    if (storyId) {
      const story = await db.collection('stories').findOne({ _id: new mongoose.Types.ObjectId(storyId) });
      if (story) {
        await db.collection('stories').updateOne(
          { _id: new mongoose.Types.ObjectId(storyId) },
          { $inc: { views: 1 } }
        );
      }
      return NextResponse.json({ success: true, data: story });
    }

    let query: any = { isVerified: true };
    if (nurseId) query.nurseId = nurseId;
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const stories = await db.collection('stories')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    console.error('Stories error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { 
      nurseId, nurseName, title, titleAr, description, descriptionAr, 
      category, beforeImage, afterImage, videoUrl 
    } = body;

    if (!nurseId || !nurseName || !title || !description || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const story: Story = {
      nurseId,
      nurseName,
      title,
      titleAr: titleAr || title,
      description,
      descriptionAr: descriptionAr || description,
      category,
      beforeImage,
      afterImage,
      videoUrl,
      likes: 0,
      views: 0,
      isVerified: false,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = mongoose.connection.db;
    const result = await db.collection('stories').insertOne(story);

    return NextResponse.json({ 
      success: true, 
      data: { ...story, _id: result.insertedId },
      message: 'Story submitted for review!'
    });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { storyId, action, userId } = body;

    if (!storyId || !action) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const db = mongoose.connection.db;

    if (action === 'like') {
      await db.collection('stories').updateOne(
        { _id: new mongoose.Types.ObjectId(storyId) },
        { $inc: { likes: 1 } }
      );
      return NextResponse.json({ success: true, message: 'Story liked!' });
    }

    if (action === 'verify' || action === 'feature') {
      const updateFields = action === 'verify' 
        ? { isVerified: true }
        : { isFeatured: true };
      
      await db.collection('stories').updateOne(
        { _id: new mongoose.Types.ObjectId(storyId) },
        { $set: { ...updateFields, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: `Story ${action}ed!` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update story error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}