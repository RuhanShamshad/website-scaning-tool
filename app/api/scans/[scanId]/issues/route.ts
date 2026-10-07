import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { assertWorkspaceScanAccess, requireAppSession } from "@/lib/auth/session";

export async function GET(request: Request, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const { scanId } = await params;
    const session = await requireAppSession();
    await assertWorkspaceScanAccess(scanId, session.workspaceId);
    const { searchParams } = new URL(request.url);

    const issues = await prisma.issue.findMany({
      where: {
        scanId,
        workspaceId: session.workspaceId,
        category: searchParams.get("category") ? (searchParams.get("category") as never) : undefined,
        severity: searchParams.get("severity") ? (searchParams.get("severity") as never) : undefined
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ issues });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load issues." },
      { status: 400 }
    );
  }
}
