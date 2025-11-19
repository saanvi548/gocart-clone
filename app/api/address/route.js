import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request)
{
    try{
        const {userId}=getAuth(request)
        
        // FIX 1: Add authorization check
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID missing' }, { status: 401 });
        }

        const {address}=await request.json()

        // FIX 2: Create a new data object instead of mutating the request body
        const addressData = {
            ...address,
            userId: userId // Inject the authenticated user's ID
        };

        const newAddress= await prisma.address.create({
            data: addressData
        })

        return NextResponse.json({newAddress,message :'Address added successfully'}) 
    }catch(error)
    {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}


export async function GET(request)
{
    try{
        const {userId}=getAuth(request)

        // FIX 1: Add authorization check
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID missing' }, { status: 401 });
        }

        const addresses= await prisma.address.findMany({
                where:{userId}
        })

        return NextResponse.json({addresses}) 
    }catch(error)
    {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}