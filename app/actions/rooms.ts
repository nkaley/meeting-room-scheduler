"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const ROOM_NAME_MAX = 30;
const ROOM_DESCRIPTION_MAX = 100;

export async function createRoom(name: string, description: string) {
  await requireAdmin();
  const n = name?.trim();
  if (!n) return { error: "Name is required" };
  if (n.length > ROOM_NAME_MAX) return { error: `Room name must be at most ${ROOM_NAME_MAX} characters` };
  const desc = description?.trim() || null;
  if (desc && desc.length > ROOM_DESCRIPTION_MAX) return { error: `Description must be at most ${ROOM_DESCRIPTION_MAX} characters` };
  await prisma.room.create({
    data: { name: n, description: desc },
  });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}

export async function updateRoom(
  roomId: string,
  name: string,
  description: string,
  isActive?: boolean
) {
  await requireAdmin();
  const n = name?.trim();
  if (!n) return { error: "Name is required" };
  if (n.length > ROOM_NAME_MAX) return { error: `Room name must be at most ${ROOM_NAME_MAX} characters` };
  const desc = description?.trim() || null;
  if (desc && desc.length > ROOM_DESCRIPTION_MAX) return { error: `Description must be at most ${ROOM_DESCRIPTION_MAX} characters` };
  await prisma.room.update({
    where: { id: roomId },
    data: {
      name: n,
      description: desc,
      ...(typeof isActive === "boolean" && { isActive }),
    },
  });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}

export async function deleteRoom(roomId: string) {
  await requireAdmin();
  await prisma.room.delete({ where: { id: roomId } });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}
