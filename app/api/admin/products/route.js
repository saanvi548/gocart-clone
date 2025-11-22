import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");

    let filters = {};

    if (city) {
      filters.city = city;
    }

    if (category) {
      filters.category = category;
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = Number(minPrice);
      if (maxPrice) filters.price.lte = Number(maxPrice);
    }

    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to filter products" },
      { status: 500 }
    );
  }
}
