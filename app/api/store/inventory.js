import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) return res.status(401).json({ error: "Not authorized" });

    // Fetch orders linked to this retailer
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
