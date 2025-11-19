import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; // FIX: Added missing import


export async function POST(request)
{
    try{
        const {userId}=getAuth(request)
        
        // Check for unauthorized access
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {cart}=await request.json()

        await prisma.user.update({
            where:{id:userId},
            data:{cart:cart}
        })
        
        // FIX: Corrected the return statement syntax
        return NextResponse.json({message :'Cart updated'}) 
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
        
        // Check for unauthorized access
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user =await prisma.user.findUnique({
            where:{id:userId},
        })

        // NOTE: If user is not found, user will be null. Accessing user.cart may throw an error.
        // It's safer to check for user existence.

        return NextResponse.json({cart :user?.cart || []}) // Used optional chaining for safety
    }catch(error)
    {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}