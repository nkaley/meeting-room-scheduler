import { Router, Request, Response } from "express";
import { z } from "zod";
import { getOrCreateSettings, updateSettings } from "../lib/settings.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const router = Router();

const updateSchema = z.object({
  workStartHour: z.number().int().min(0).max(23),
  workEndHour: z.number().int().min(0).max(23),
  timezone: z.string(),
  bookingStepMinutes: z.number().int().positive(),
  workDays: z.array(z.number().int().min(0).max(6)),
  maxBookingDistanceDays: z.number().int().positive(),
  maxBookingDurationMinutes: z.number().int().positive(),
  requireDescription: z.boolean(),
});

// GET /api/settings (auth, admin for consistency; or allow any authenticated for calendar)
router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

// PATCH /api/settings (admin only)
router.patch("/", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid settings" });
    return;
  }
  const data = parsed.data;
  if (data.workEndHour <= data.workStartHour) {
    res.status(400).json({ error: "settingsErrorEndBeforeStart" });
    return;
  }
  const result = await updateSettings(data);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

export default router;
