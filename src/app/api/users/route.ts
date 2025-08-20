import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminUserFromToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// GET all users (Admin only)
export async function GET(req: NextRequest) {
  const adminUser = await getAdminUserFromToken(req);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      // Exclude password from the result
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new user (Admin only)
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUserFromToken(req);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
