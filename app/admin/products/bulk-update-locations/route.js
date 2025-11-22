import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get products without location
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      include: { store: true }
    });

    let updatedCount = 0;

    for (const product of products) {
      if (product.store.latitude && product.store.longitude) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            latitude: product.store.latitude,
            longitude: product.store.longitude,
            address: product.store.address,
            placeId: product.store.placeId,
            city: product.store.city,
            country: product.store.country,
          }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} products with store locations`,
      updatedCount 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}