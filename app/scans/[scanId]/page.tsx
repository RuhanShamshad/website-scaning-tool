import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { assertWorkspaceScanAccess, requireAppSession } from "@/lib/auth/session";
import { IssueCard } from "@/app/scans/[scanId]/issue-card";
import { ScanProgress } from "@/app/scans/[scanId]/scan-progress";
import { RescanButton } from "@/app/scans/[scanId]/rescan-button";

const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "SUGGESTION"];
const categoryLabels = ["DESIGN", "RESPONSIVE", "CONTENT", "ACCESSIBILITY", "SEO", "PERFORMANCE", "TECHNICAL", "IMAGES", "LINKS", "CONSOLE", "SPELLING"];

export default async function ScanReportPage({
  params,
  searchParams
}: {
  params: Promise<{ scanId: string }>;
  searchParams: Promise<{ severity?: string; category?: string }>;
}) {
  const { scanId } = await params;
  const filters = await searchParams;
  const session = await requireAppSession();
  await assertWorkspaceScanAccess(scanId, session.workspaceId).catch(() => notFound());

  const scan = await prisma.scan.findUniqueOrThrow({
    where: { id: scanId },
    include: {
      website: true,
      pages: { include: { screenshots: true, _count: { select: { issues: true } } } },
      issues: {
        where: {
          severity: filters.severity ? (filters.severity as never) : undefined,
          category: filters.category ? (filters.category as never) : undefined
        },
        orderBy: [{ severity: "asc" }, { confidence: "desc" }]
      },
      _count: { select: { issues: true, pages: true } }
    }
  });

  const counts = severityOrder.map((severity) => ({
    severity,
    count: scan.issues.filter((issue) => issue.severity === severity).length
  }));

  return (
    <main className="shell space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2358ff]">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <RescanButton scanId={scan.id} />
      </div>

      <section className="panel p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_180px] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-[#667085]">{scan.website.domain}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal">Scan report</h1>
            <p className="mt-2 break-all text-sm text-[#667085]">{scan.normalizedUrl}</p>
            {scan.summary ? <p className="mt-4 max-w-3xl text-sm leading-6">{scan.summary}</p> : null}
          </div>
          <div className="rounded-md border border-[#d9dee8] p-4 text-center">
            <p className="text-sm font-semibold text-[#667085]">Overall score</p>
            <p className="mt-2 text-4xl font-bold">{scan.score ?? scan.progress}</p>
            <p className="text-sm text-[#667085]">{scan.score === null ? "progress" : "out of 100"}</p>
          </div>
        </div>
        <ScanProgress scanId={scan.id} initialStatus={scan.status} initialProgress={scan.progress} />
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {counts.map((item) => (
          <div key={item.severity} className="panel p-4">
            <p className="text-xs font-bold text-[#667085]">{item.severity}</p>
            <p className="mt-1 text-2xl font-bold">{item.count}</p>
          </div>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Page inventory</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scan.pages.map((page) => (
            <div key={page.id} className="rounded-md border border-[#d9dee8] p-4">
              <p className="font-semibold">{page.title || "Untitled page"}</p>
              <p className="mt-1 break-all text-sm text-[#667085]">{page.url}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#667085]">
                <span className="badge">{page.httpStatus ?? "N/A"} status</span>
                <span className="badge">{page.loadTimeMs ?? "N/A"} ms</span>
                <span className="badge">{page._count.issues} issues</span>
                <span className="badge inline-flex items-center gap-1"><Camera size={12} />{page.screenshots.length} shots</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Issues</h2>
          <div className="flex flex-wrap gap-2">
            <FilterLink scanId={scan.id} label="All" />
            {severityOrder.map((severity) => <FilterLink key={severity} scanId={scan.id} label={severity} severity={severity} />)}
            {categoryLabels.map((category) => <FilterLink key={category} scanId={scan.id} label={category} category={category} />)}
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {scan.issues.length === 0 ? (
            <div className="rounded-md border border-[#d9dee8] p-8 text-sm text-[#667085]">No issues match the current filter.</div>
          ) : (
            scan.issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          )}
        </div>
      </section>

      {scan.errorMessage ? (
        <section className="panel border-red-200 p-5 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold"><RefreshCw size={16} />Scan failed</div>
          <p className="mt-2">{scan.errorMessage}</p>
        </section>
      ) : null}
    </main>
  );
}

function FilterLink({ scanId, label, severity, category }: { scanId: string; label: string; severity?: string; category?: string }) {
  const params = new URLSearchParams();
  if (severity) params.set("severity", severity);
  if (category) params.set("category", category);
  const href = params.size ? `/scans/${scanId}?${params.toString()}` : `/scans/${scanId}`;

  return <Link href={href} className="badge hover:border-[#2358ff] hover:text-[#2358ff]">{label}</Link>;
}
