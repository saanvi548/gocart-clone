import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const strip=new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {

    try{
        const body=await request.text()
        const sig=request.get('stripe-signature')

        const event =Stripe.webhooks.constructEvent(body,sig,process.env.STRIPE_WEBHOOK_SECRET)
        const handlePaymentIntent =async (paymentIntentId,isPaid)=>{

            const session =await Stripe.Checkout.session.list({
                payment_intent:paymentIntentId
            })

            const {orderIds,userId,appId}=session.data[0].metadata

            if(appId!=='gocart')
            {
                return NextResponse.json({received:true,message:'Invalid app id'})
            }

            const orderIdsArray =orderIds.split(',')

            if(isPaid)
            {
                await Promise.all(orderIdsArray.map(async(orderId)=>{
                    await prisma.order.update({
                        where:{id:orderId},
                        data:{isPaid:true}
                    })
                }))

                await prisma.user.update({
                    where:{id :userId},
                    data:{cart:{}}
                })

            }
            else{
                await Promise.all(orderIdsArray.map(async (orderId)=>{
                    await prisma.order.delete({
                        where:{id:orderId}
                    })
                }))
            }
        }

        

        switch(event.type){
            case 'payment_intent.succeeded':{
                await handlePaymentIntent(event.data.object.id,true)
                break;
            }
             case 'payment_intent.canceled':{
                await handlePaymentIntent(event.data.object.id,false)
                break;
            }
            default:
                console.log('Unhandled event type: ',event.type)
                break;
            
        }

        return NextResponse.json({received:true})
    }catch(error)
    {
        console.error(error)
        return NextResponse.json({error:error.message},{status:400})

    }
    
}

export const config={
    api:{bodyparser:false}
}

