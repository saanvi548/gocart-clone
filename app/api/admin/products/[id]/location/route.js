import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function PATCH(request, { params }) {
  try {
    // 🔐 Get Clerk user from request
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = params;

    const body = await request.json();
    const { latitude, longitude, address, placeId, city, country } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Check if admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { latitude, longitude, address, placeId, city, country }
    });

    return NextResponse.json(
      { message: "Product location updated", product: updatedProduct },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
