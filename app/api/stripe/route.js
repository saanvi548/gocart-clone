import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const runtime = "nodejs"   // REQUIRED for raw body in app router

export async function POST(request) {
    try {
        // Read raw body
        const body = await request.text()
        const sig = request.headers.get("stripe-signature")

        // Verify webhook
        const event = Stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )

        const handlePaymentIntent = async (paymentIntentId, isPaid) => {
            // FIXED — use stripe instance properly
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
                limit: 1
            })

            const session = sessions.data[0]
            if (!session) return

            const { orderIds, userId, appId } = session.metadata

            if (appId !== "gocart") {
                return NextResponse.json({
                    received: true,
                    message: "Invalid app id"
                })
            }

            const orderIdsArray = orderIds.split(",")

            if (isPaid) {
                // Mark orders as paid
                await Promise.all(
                    orderIdsArray.map(id =>
                        prisma.order.update({
                            where: { id },
                            data: { isPaid: true }
                        })
                    )
                )

                // Clear cart (JSON field)
                await prisma.user.update({
                    where: { id: userId },
                    data: { cart: { set: {} } }
                })

            } else {
                // Delete orders on failure
                await Promise.all(
                    orderIdsArray.map(id =>
                        prisma.order.delete({ where: { id } })
                    )
                )
            }
        }

        // Handle event types
        switch (event.type) {
            case "payment_intent.succeeded":
                await handlePaymentIntent(event.data.object.id, true)
                break

            case "payment_intent.canceled":
            case "payment_intent.payment_failed":
                await handlePaymentIntent(event.data.object.id, false)
                break

            default:
                console.log("Unhandled event", event.type)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
