const { default: prisma } = require("@/lib/prisma")

const authSeller = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true },
        })

        if (user && user.store) {
            if (user.store.status === 'approved') {
                return user.store.id
            } else {
                // FIX: Explicitly return false if store exists but status is NOT approved (e.g., pending/rejected)
                return false 
            }
        } else {
            // FIX: Explicitly return false if user or store does not exist
            return false
        }

    } catch (error) {
        console.error("AuthSeller Error:", error)
        // Ensure you return false on error too
        return false 
    }
}

export default authSeller