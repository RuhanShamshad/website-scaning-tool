import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertWorkspaceScanAccess, requireAppSession } from "@/lib/auth/session";
import { enqueueScan } from "@/lib/queue/scans";

export async function POST(_request: Request, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const { scanId } = await params;
    const session = await requireAppSession();
    const previous = await assertWorkspaceScanAccess(scanId, session.workspaceId);

    const next = await prisma.scan.create({
      data: {
        workspaceId: session.workspaceId,
        websiteId: previous.websiteId,
        submittedUrl: previous.submittedUrl,
        normalizedUrl: previous.normalizedUrl,
        type: previous.type,
        maxPages: previous.maxPages
      }
    });

    await enqueueScan({ scanId: next.id, workspaceId: session.workspaceId });
    return NextResponse.json({ scanId: next.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start re-scan." },
      { status: 500 }
    );
  }
}
