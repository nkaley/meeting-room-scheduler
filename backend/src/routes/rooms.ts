import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const router = Router();
const ROOM_NAME_MAX = 30;
const ROOM_DESCRIPTION_MAX = 100;

const createRoomSchema = z.object({
  name: z.string().min(1).max(ROOM_NAME_MAX),
  description: z.string().max(ROOM_DESCRIPTION_MAX).optional().nullable(),
});

const updateRoomSchema = createRoomSchema.extend({
  isActive: z.boolean().optional(),
});

// GET /api/rooms — list rooms (auth required)
router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  res.json(rooms);
});

// POST /api/rooms — create (admin only)
router.post("/", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    res.status(400).json({ error: first || "Invalid data" });
    return;
  }
  const { name, description } = parsed.data;
  await prisma.room.create({
    data: { name: name.trim(), description: description?.trim() || null },
  });
  res.status(201).json({ success: true });
});

// PATCH /api/rooms/:id
router.patch("/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    res.status(400).json({ error: first || "Invalid data" });
    return;
  }
  const { name, description, isActive } = parsed.data;
  await prisma.room.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });
  res.json({ success: true });
});

// DELETE /api/rooms/:id
router.delete("/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  await prisma.room.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
