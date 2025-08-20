import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAdminUserFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUserFromToken(req);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.TimeLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }
    
    if (startDate || endDate) {
        const timestampFilter: Prisma.DateTimeFilter = {};
        if (startDate) {
            timestampFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setDate(endOfDay.getDate() + 1);
            timestampFilter.lt = endOfDay;
        }
        where.timestamp = timestampFilter;
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(timeLogs, { status: 200 });

  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
