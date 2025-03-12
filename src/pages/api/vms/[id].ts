import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid VM ID" });
  }

  try {
    // Check if VM belongs to user
    const vm = await prisma.vM.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!vm) {
      return res.status(404).json({ message: "VM not found" });
    }

    if (req.method === "GET") {
      return res.status(200).json(vm);
    } else if (req.method === "PUT") {
      // Update VM status (start/stop)
      const { action } = req.body;

      if (action === "start") {
        if (vm.status === "running") {
          return res.status(400).json({ message: "VM is already running" });
        }

        // In a real implementation, we would start the VM here
        const updatedVm = await prisma.vM.update({
          where: { id },
          data: { status: "running" },
        });

        return res.status(200).json(updatedVm);
      } else if (action === "stop") {
        if (vm.status === "stopped") {
          return res.status(400).json({ message: "VM is already stopped" });
        }

        // In a real implementation, we would stop the VM here
        const updatedVm = await prisma.vM.update({
          where: { id },
          data: { status: "stopped" },
        });

        return res.status(200).json(updatedVm);
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }
    } else if (req.method === "DELETE") {
      // Delete VM
      await prisma.vM.delete({
        where: { id },
      });

      return res.status(204).end();
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling VM request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}