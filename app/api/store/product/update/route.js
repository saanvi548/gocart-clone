import authSeller from "@/middleware/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =========================================================
// POST: Update an existing product (Authenticated Seller Required)
// =========================================================
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, mrp, price, stock, stockStatus, availableFrom, availableTo } = body;

        // Basic validation
        if (!id || mrp === undefined || price === undefined || stock === undefined || !stockStatus || !availableFrom || !availableTo) {
            return NextResponse.json({ error: 'Missing required product data' }, { status: 400 });
        }

        // Price validation (Optional, but good practice)
        if (price > mrp) {
             return NextResponse.json({ error: 'Offer Price cannot be higher than MRP' }, { status: 400 });
        }

        // Update product record in the database
        const updatedProduct = await prisma.product.update({
            where: {
                id: id,
                storeId: storeId // Important: Ensure the seller owns the product
            },
            data: {
                mrp: mrp,
                price: price,
                stock: stock,
                stockStatus: stockStatus,
                availableFrom: new Date(availableFrom), // Convert ISO string back to Date object
                availableTo: new Date(availableTo),     // Convert ISO string back to Date object
            }
        });

        if (!updatedProduct) {
             return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: "Product updated successfully" });

    } catch (error) {
        console.error("Product Update API Error:", error);
        // Handle Prisma errors specifically, or return a generic 500 error
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
