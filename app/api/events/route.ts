import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Handler for GET /api/events
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch all events from the events collection
    const events = await db.collection('events').find({}).toArray();
    
    // Transform MongoDB _id to string
    const formattedEvents = events.map(event => ({
      ...event,
      _id: event._id.toString(),
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// Handler for POST /api/events
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const eventData = await request.json();
    
    // Make sure status is set if not provided
    if (!eventData.status) {
      eventData.status = 'scheduled';
    }
    
    // Add created timestamp
    const event = {
      ...eventData,
      createdAt: new Date(),
    };
    
    const result = await db.collection('events').insertOne(event);
    
    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// Handler for PUT /api/events
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const eventData = await request.json();
    
    // Extract _id and convert to MongoDB ObjectId
    const { _id, ...updateData } = eventData;
    const { ObjectId } = require('mongodb');
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      _id, 
      ...updateData 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
} 