import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('User email:', user?.email);
    console.log('Admin email:', process.env.ADMIN_EMAIL);

    // Check if user is admin (optional - comment out for testing)
    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

    console.log('Products without location:', products.length);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}