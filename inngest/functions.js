import { inngest } from './client'
import prisma from '@/lib/prisma'

// -------------------------------------------------------------
// INNGEST function to create user data in database
// -------------------------------------------------------------
export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-create'},
    {event: 'clerk/user.created'},
    async ({event})=>{
        const{data} = event
        
        // FIX: Using optional chaining (?. ) to safely access the email property.
        // If data.email_addresses or data.email_addresses[0] is undefined, 
        // it defaults to the empty string ('') using the nullish coalescing operator (??).
        const primaryEmail = data.email_addresses?.[0]?.email_address ?? '';
        const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();
        
        await prisma.user.create({
            data: { 
                id: data.id,
                email: primaryEmail,
                name: fullName,
                image: data.image_url,
            }
        })
    }
)

// -------------------------------------------------------------
// INNGEST function to update user data in database
// -------------------------------------------------------------
export const syncUserUpdation = inngest.createFunction(
    {id: 'sync-user-update'},
    {event: 'clerk/user.updated'},
    async ({event})=>{
        const{data} = event
        
        // FIX: Applying the same safe access logic here
        const primaryEmail = data.email_addresses?.[0]?.email_address ?? '';
        const fullName = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();

        await prisma.user.update({
            where: {id:data.id},
            data: { 
                email: primaryEmail,
                name: fullName,
                image: data.image_url,
            }
        })
    }
)

// -------------------------------------------------------------
// INNGEST function to delete user data in database
// -------------------------------------------------------------
export const syncUserDeletion = inngest.createFunction(
    {id: 'sync-user-delete'},
    {event: 'clerk/user.deleted'},
    async ({event})=>{
        const{data} = event
        await prisma.user.delete({
           where: {id:data.id},
        })
    }
)