import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertWorkspaceScanAccess, requireAppSession } from "@/lib/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const { scanId } = await params;
    const session = await requireAppSession();
    await assertWorkspaceScanAccess(scanId, session.workspaceId);

    const scan = await prisma.scan.findUniqueOrThrow({
      where: { id: scanId },
      include: {
        website: true,
        pages: { include: { screenshots: true, _count: { select: { issues: true } } } },
        issues: { orderBy: [{ severity: "asc" }, { createdAt: "desc" }] },
        _count: { select: { issues: true, pages: true } }
      }
    });

    return NextResponse.json(scan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan was not found." },
      { status: 404 }
    );
  }
}
