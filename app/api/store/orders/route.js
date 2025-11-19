import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
// You must import authSeller because it is used in both functions.
import authSeller from "@/middleware/authSeller" 
import { NextResponse } from "next/server"

// =========================================================
// POST: Update Order Status
// =========================================================
export async function POST(request){
    try{
        const {userId}=getAuth(request)
        const storeId=await authSeller(userId)

        // FIX 1: Must use NextResponse.json() for returning JSON response
        if(!storeId)
            return NextResponse.json({ error :'not authorized'},{status:401})

        const {orderId,status}=await request.json()

        // Added basic validation to prevent null updates (Absolutely necessary)
        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
        }

        await prisma.order.update({
            // Ensure order belongs to the store before updating
            where:{id:orderId,storeId}, 
            data:{status}
        })

        return NextResponse.json({message: "Order Status updated"})
    }catch(error)
    {
        console.error(error)
        return NextResponse.json({error:error.code ||error.message},{status:400})
    }
}

// =========================================================
// GET: Fetch all orders for the store
// =========================================================
export async function GET(request){
    try{
        const {userId}=getAuth(request)
        const storeId=await authSeller(userId)

        if(!storeId)
            return NextResponse.json({ error :'not authorized'},{status:401})

        const orders =await prisma.order.findMany({
            where:{storeId},
            include:{
                user:true,
                address:true,
                orderItems: {include: {product:true}}
            },
            orderBy:{createdAt:'desc'} // 'desc' must be lowercase
        })
        

        return NextResponse.json({orders}) 
    }catch(error)
    {
        console.error(error)
        return NextResponse.json({error:error.code ||error.message},{status:400})
    }
}