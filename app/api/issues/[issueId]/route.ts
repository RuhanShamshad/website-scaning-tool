import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAppSession } from "@/lib/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ issueId: string }> }) {
  try {
    const { issueId } = await params;
    const session = await requireAppSession();
    const body = await request.json();
    const status = body.status;

    if (!["OPEN", "FIXED", "IGNORED"].includes(status)) {
      return NextResponse.json({ error: "Invalid issue status." }, { status: 400 });
    }

    const issue = await prisma.issue.findFirst({
      where: { id: issueId, workspaceId: session.workspaceId }
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue was not found." }, { status: 404 });
    }

    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update issue." },
      { status: 500 }
    );
  }
}
