import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.systemSettings.count();
    if (count === 0) {
      await prisma.systemSettings.create({
        data: {
          workStartHour: 9,
          workEndHour: 18,
          bookingStepMinutes: 30,
          workDays: [1, 2, 3, 4, 5],
          maxBookingDistanceDays: 14,
          maxBookingDurationMinutes: 120,
          requireDescription: false,
        },
      });
      console.log("Created default SystemSettings.");
    }
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : "";
    if (msg.includes("system_settings") && msg.includes("does not exist")) {
      console.error("Table system_settings not found. Run: npx prisma db push");
      process.exit(1);
    }
    throw e;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
