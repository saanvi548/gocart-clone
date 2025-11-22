import { auth } from "@clerk/nextjs"; // 🌟 FIX 1: Use 'auth' for App Router
import authSeller from "@/middleware/authSeller";
import imagekit from "@/configs/imageKit";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// =========================================================
// POST: Add a new product (Authenticated Seller Required)
// =========================================================
export async function POST(request) {
    
    try {
        // 🌟 FIX 2: Use the Clerk App Router helper 'auth()'
        const { userId } = auth(); 
        
        // 🌟 Improvement: Return 401 early if Clerk session is missing
        if (!userId) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        const storeId = await authSeller(userId);

        // FIX 1 (Authorization): Deny access if storeId is NOT returned (i.e., false or null)
        if (!storeId) {
            // Note: Use 403 (Forbidden) if userId exists but they lack seller status
            return NextResponse.json({ error: 'Not authorized as a seller' }, { status: 403 });
        }

        const formData= await request.formData()
        const name=formData.get("name")
        const description=formData.get("description")
        const mrp=Number(formData.get("mrp"))
        const price=Number(formData.get("price"))
        const category=formData.get("category")
        const latitude = formData.get("latitude") ? Number(formData.get("latitude")) : null;
        const longitude = formData.get("longitude") ? Number(formData.get("longitude")) : null;
        const address = formData.get("address");
        const placeId = formData.get("placeId");
        const city = formData.get("city");
        const country = formData.get("country");
        
        
        
        // 👇 EXTRACT NEW FIELDS FROM CLIENT FORM DATA
        const stock=formData.get("stock")
        const stockStatus=formData.get("stockStatus")
        const availableFrom=formData.get("availableFrom") 
        const availableTo=formData.get("availableTo") 
        // 👆

        // FIX 2 (Image Fetching): Use the correct key "images" sent from the client
        const images = formData.getAll("images"); 
      
        // Basic data validation
        if (!name || !description || !mrp || !price || !category || images.length < 1 || mrp <= 0 || price <= 0) {
            return NextResponse.json({ error: 'Missing or invalid product details' }, { status: 400 });
        }

        // Image upload and processing logic
        const imagesUrl = await Promise.all(images.map(async (image) => {
            // 🌟 Improvement: Validate that 'image' is a File object before proceeding
            if (!(image instanceof File)) {
                throw new Error("Invalid image file uploaded.");
            }
            
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products",
            });

            // Generate ImageKit URL with transformations
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1024' }
                ]
            });
            return url;
        }));
        
        // Create product record in the database with location data
        const newProduct = await prisma.product.create({ // 🌟 Improvement: Capture the created product
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId,
                 latitude,
                longitude,
                address,
                placeId,
                city,
                country,
                stock: parseInt(String(stock), 10), 
                stockStatus: String(stockStatus).toUpperCase().replace(/\s/g, '_'), // Format for Prisma ENUM
                availableFrom: new Date(String(availableFrom)), // Convert string date to Date object
                availableTo: new Date(String(availableTo)),  // Use the authenticated storeId
            }
        });

        return NextResponse.json({ message: "Product added successfully", product: newProduct }, { status: 201 }); // 🌟 Improvement: Use 201 Created


    } catch (error) {
        console.error("Product POST Error:", error);
        return NextResponse.json({ error: error.code || error.message, message: "Internal server error" }, { status: 500 }); // 🌟 Improvement: Use 500 for generic catch
    }
}



// =========================================================
// GET: Fetch all products for the authenticated store (UNCHANGED)
// =========================================================
export async function GET(request) {
    try {
        // 🌟 FIX 2: Use the Clerk App Router helper 'auth()'
        const { userId } = auth();
        
        // 🌟 Improvement: Return 401 early if Clerk session is missing
        if (!userId) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }
    
        const storeId = await authSeller(userId);
    
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