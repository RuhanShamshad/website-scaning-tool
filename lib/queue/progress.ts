import { prisma } from "@/lib/db/prisma";

export async function updateScanProgress(scanId: string, status: string, progress: number) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: status as never,
      progress: Math.max(0, Math.min(100, Math.round(progress)))
    }
  });
}
