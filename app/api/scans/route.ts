import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAppSession } from "@/lib/auth/session";
import { enqueueScan } from "@/lib/queue/scans";
import { assertPubliclyRoutable, normalizeSubmittedUrl, UrlValidationError } from "@/lib/security/url";
import { scanRequestSchema } from "@/lib/validation/scans";

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const input = scanRequestSchema.parse(await request.json());
    const safeUrl = normalizeSubmittedUrl(input.url);
    await assertPubliclyRoutable(safeUrl.normalized);

    const website = await prisma.website.upsert({
      where: { workspaceId_domain: { workspaceId: session.workspaceId, domain: safeUrl.domain } },
      update: { url: safeUrl.normalized },
      create: {
        workspaceId: session.workspaceId,
        url: safeUrl.normalized,
        domain: safeUrl.domain
      }
    });

    const scan = await prisma.scan.create({
      data: {
        workspaceId: session.workspaceId,
        websiteId: website.id,
        submittedUrl: input.url,
        normalizedUrl: safeUrl.normalized,
        type: input.scanType === "quick" ? "QUICK" : "FULL",
        maxPages: input.scanType === "quick" ? 1 : input.maxPages
      }
    });

    await enqueueScan({ scanId: scan.id, workspaceId: session.workspaceId });

    return NextResponse.json({ scanId: scan.id }, { status: 201 });
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start scan." },
      { status: 500 }
    );
  }
}
