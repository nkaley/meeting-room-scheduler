import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/users — list users (admin only)
router.get("/", authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      surname: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      surname: u.surname,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

// DELETE /api/users/:id
router.delete("/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const currentUser = (req as Request & { user: { userId: string } }).user;
  const userId = req.params.id;
  if (userId === currentUser.userId) {
    res.status(400).json({ error: "You cannot delete yourself" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await prisma.user.delete({ where: { id: userId } });
  res.json({ success: true });
});

export default router;
