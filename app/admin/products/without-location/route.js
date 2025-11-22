import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    console.log('=== DEBUG INFO ===');
    console.log('User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('User from DB:', user);
    console.log('User email:', user?.email);
    console.log('Admin email from env:', process.env.ADMIN_EMAIL);

    // TEMPORARILY COMMENT OUT ADMIN CHECK FOR DEBUGGING
    // if (user.email !== process.env.ADMIN_EMAIL) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Fetch products without location data
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      include: {
        store: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
            address: true,
            placeId: true,
            city: true,
            country: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Products found:', products.length);
    console.log('==================');

    return NextResponse.json({ products });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}