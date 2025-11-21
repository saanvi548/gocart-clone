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
        const {userId}=getAuth(request)
        const storeId =await authSeller(userId)

        // FIX 1 (Authorization): Deny access if storeId is NOT returned (i.e., false or null)
        if(!storeId) 
        {
            return NextResponse.json({error:'not authorized'},{status:401})
        }

        const formData= await request.formData()
        const name=formData.get("name")
        const description=formData.get("description")
        const mrp=Number(formData.get("mrp"))
        const price=Number(formData.get("price"))
        const category=formData.get("category")
        
        // 👇 EXTRACT NEW FIELDS FROM CLIENT FORM DATA
        const stock=formData.get("stock")
        const stockStatus=formData.get("stockStatus")
        const availableFrom=formData.get("availableFrom") 
        const availableTo=formData.get("availableTo") 
        // 👆

        // FIX 2 (Image Fetching): Use the correct key "images" sent from the client
        const images=formData.getAll("images") 
      
        // Basic data validation - UPDATED TO INCLUDE NEW FIELDS
        if(!name||!description||!mrp||!price||!category||!stock||!stockStatus||!availableFrom||!availableTo||images.length<1)
        {
            return NextResponse.json({error: 'missing product details'},{status:400})
        }

        // Image upload and processing logic (UNCHANGED)
        const imagesUrl =await Promise.all(images.map(async(image)=>{
            const buffer=Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file:buffer,
                fileName:image.name,
                folder:"products",
            })

            // Generate ImageKit URL with transformations
            const url=imagekit.url({
                path:response.filePath,
                transformation:[
                    {quality: 'auto'},
                    {format:'webp'},
                    {width: '1024'}
                ]
            })
            return url
        }))
        
        // Create product record in the database
        await prisma.product.create({
            data:{
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId, // Use the authenticated storeId
                // 👇 INSERTING NEW FIELDS WITH CORRECT TYPE CASTING
                stock: parseInt(String(stock), 10), 
                stockStatus: String(stockStatus).toUpperCase().replace(/\s/g, '_'), // Format for Prisma ENUM
                availableFrom: new Date(String(availableFrom)), // Convert string date to Date object
                availableTo: new Date(String(availableTo)),     // Convert string date to Date object
                // 👆
            }
        })

        return NextResponse.json({message:"Product added successfully"})


    }catch(error){
        console.error(error)
        return NextResponse.json({error:error.code||error.message},{status:400})
    }
}

// =========================================================
// GET: Fetch all products for the authenticated store (UNCHANGED)
// =========================================================
export async function GET(request) {
    try{
        const {userId}=getAuth(request)
    
        const storeId= await authSeller(userId)
    
        if(!storeId)
        {
            return NextResponse.json({error : 'not authorized'},{status : 401})
        }
    
        const products =await prisma.product.findMany({where:{storeId}}) 
        return NextResponse.json({products})
            
    }catch(error)
    {
        console.error(error);
        return NextResponse.json({error: error.code|| error.message},{status:400})
    }
}