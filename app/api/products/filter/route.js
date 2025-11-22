import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Haversine distance function (distance between 2 lat/lng points)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const distance = parseFloat(searchParams.get("distance")) || null;
    const sort = searchParams.get("sort") || "";

    // Base query
    let where = {};

    // Search filter
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Price filters
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Products from DB
    let products = await prisma.product.findMany({
      where,
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
          ? { price: "desc" }
          : undefined,
    });

    // Location + distance filter (runs after DB)
    if (!isNaN(lat) && !isNaN(lng) && distance) {
      products = products.filter((product) => {
        if (!product.latitude || !product.longitude) return false;

        const d = calculateDistance(
          lat,
          lng,
          product.latitude,
          product.longitude
        );

        return d <= distance;
      });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error("FILTER ERROR:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
