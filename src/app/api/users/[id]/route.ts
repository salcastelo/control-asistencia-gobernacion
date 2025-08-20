import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const token = _req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    // Optional: Add check to prevent admin from deleting themselves
    if (decoded.userId === userId) {
        return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
