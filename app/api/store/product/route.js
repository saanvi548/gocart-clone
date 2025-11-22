import authSeller from "@/middleware/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import imagekit from "@/configs/imageKit";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =========================================================
// POST: Add a new product (Authenticated Seller Required)
// =========================================================
export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        // Check authentication
        if (!userId) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        const storeId = await authSeller(userId);

        // Check authorization
        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized as a seller' }, { status: 403 });
        }

        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp"));
        const price = Number(formData.get("price"));
        const category = formData.get("category");
        const stock = formData.get("stock");
        const stockStatus = formData.get("stockStatus");
        const availableFrom = formData.get("availableFrom");
        const availableTo = formData.get("availableTo");
        const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : null;
        const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : null;
        const address = formData.get("address");
        const placeId = formData.get("placeId");
        const city = formData.get("city");
        const country = formData.get("country");

        const images = formData.getAll("images");

        // Basic validation
        if (!name || !description || !mrp || !price || !category || !stock || !stockStatus || !availableFrom || !availableTo || images.length < 1) {
            return NextResponse.json({ error: 'Missing or invalid product details' }, { status: 400 });
        }

        // Image upload
        const imagesUrl = await Promise.all(
            images.map(async (image) => {
                if (!(image instanceof File)) {
                    throw new Error("Invalid image file uploaded.");
                }
                const buffer = Buffer.from(await image.arrayBuffer());
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products",
                });
                return imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: 'auto' },
                        { format: 'webp' },
                        { width: '1024' },
                    ],
                });
            })
        );

        // Create product in DB
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId,
                stock: parseInt(String(stock), 10),
                stockStatus: String(stockStatus).toUpperCase().replace(/\s/g, '_'),
                availableFrom: new Date(String(availableFrom)),
                availableTo: new Date(String(availableTo)),
                latitude,
                longitude,
                address,
                placeId,
                city,
                country,
            },
        });

        return NextResponse.json({ message: "Product added successfully", product: newProduct }, { status: 201 });

    } catch (error) {
        console.error("Product POST Error:", error);
        return NextResponse.json({ error: error.code || error.message, message: "Internal server error" }, { status: 500 });
    }
}

// =========================================================
// GET: Fetch all products for the authenticated store
// =========================================================
export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        // Check authentication
        if (!userId) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        const storeId = await authSeller(userId);

        // Check authorization
        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized as a seller' }, { status: 403 });
        }

        const products = await prisma.product.findMany({ where: { storeId } });
        return NextResponse.json({ products });

    } catch (error) {
        console.error("Product GET Error:", error);
        return NextResponse.json({ error: error.code || error.message, message: "Internal server error" }, { status: 500 });
    }
}
