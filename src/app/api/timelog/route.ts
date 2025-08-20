import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromToken } from '@/lib/auth';
import { EventType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { eventType, latitude, longitude } = body;

    // Basic validation
    if (!eventType || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!Object.values(EventType).includes(eventType)) {
        return NextResponse.json({ message: 'Invalid event type' }, { status: 400 });
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        eventType,
        latitude,
        longitude,
        userId,
      },
    });

    return NextResponse.json(timeLog, { status: 201 });

  } catch (error) {
    console.error('TimeLog error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
