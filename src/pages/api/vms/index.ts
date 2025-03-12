import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const vmSchema = z.object({
  name: z.string().min(3),
  username: z.string().min(3),
  password: z.string().min(8),
  vcpuCount: z.number().min(6).max(24),
  gpuEnabled: z.boolean(),
  osType: z.enum(["windows11", "custom"]),
  customIsoUrl: z.string().url().optional().nullable(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    // Get all VMs for the user
    try {
      const vms = await prisma.vM.findMany({
        where: {
          userId: session.user.id,
        },
      });

      return res.status(200).json(vms);
    } catch (error) {
      console.error("Error fetching VMs:", error);
      return res.status(500).json({ message: "Failed to fetch VMs" });
    }
  } else if (req.method === "POST") {
    try {
      // Check if user already has 3 VMs
      const vmCount = await prisma.vM.count({
        where: {
          userId: session.user.id,
        },
      });

      if (vmCount >= 3) {
        return res
          .status(400)
          .json({ message: "You can only create up to 3 VMs" });
      }

      const vmData = vmSchema.parse(req.body);

      // Create VM
      const vm = await prisma.vM.create({
        data: {
          ...vmData,
          userId: session.user.id,
          // In a real implementation, we would provision the VM here
          // and set the status to "provisioning" until it's ready
          status: "provisioning",
          ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`, // Mock IP address
        },
      });

      // In a real implementation, we would start the VM provisioning process here
      // For now, we'll just simulate it by updating the status after a delay
      setTimeout(async () => {
        await prisma.vM.update({
          where: { id: vm.id },
          data: { status: "running" },
        });
      }, 10000);

      return res.status(201).json(vm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating VM:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}