import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

interface TokenPayload {
  userId: string;
}

// This function now specifically gets an admin user
export async function getAdminUserFromToken(req: NextRequest): Promise<User | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    // Only return the user if they exist and are an ADMIN
    if (user && user.role === 'ADMIN') {
      return user;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// We keep the old function in case we need it for non-admin user checks
export function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7); // Remove "Bearer "
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    return decoded.userId;
  } catch (error) {
    return null;
  }
}