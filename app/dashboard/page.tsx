import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireAppSession } from "@/lib/auth/session";
import { ScanForm } from "@/app/dashboard/scan-form";

export default async function DashboardPage() {
  const session = await requireAppSession();
  const scans = await prisma.scan.findMany({
    where: { workspaceId: session.workspaceId },
    include: {
      website: true,
      _count: { select: { issues: true, pages: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const latestScore = scans.find((scan) => scan.score !== null)?.score ?? null;

  return (
    <main className="shell space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2358ff]">Website Audit</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Scan any public website</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#667085]">
            Run browser-based QA checks for responsive layout, broken assets, links, accessibility, content, and frontend errors.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric icon={<Gauge size={16} />} label="Latest score" value={latestScore === null ? "N/A" : `${latestScore}`} />
          <Metric icon={<Activity size={16} />} label="Scans" value={`${scans.length}`} />
          <Metric icon={<CheckCircle2 size={16} />} label="Worker" value="Queue" />
        </div>
      </header>

      <section className="panel p-5">
        <ScanForm />
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-[#d9dee8] px-5 py-4">
          <h2 className="text-lg font-semibold">Recent scans</h2>
        </div>
        <div className="divide-y divide-[#d9dee8]">
          {scans.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-[#667085]">
              <AlertTriangle size={18} />
              No scans yet. Submit a website URL to create the first report.
            </div>
          ) : (
            scans.map((scan) => (
              <Link key={scan.id} href={`/scans/${scan.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-[#f3f5fa] md:grid-cols-[1fr_110px_110px_110px] md:items-center">
                <div>
                  <p className="font-semibold">{scan.website.domain}</p>
                  <p className="text-sm text-[#667085]">{scan.normalizedUrl}</p>
                </div>
                <span className="badge text-center">{scan.status.replaceAll("_", " ")}</span>
                <span className="text-sm text-[#667085]">{scan._count.pages} page{scan._count.pages === 1 ? "" : "s"}</span>
                <span className="text-sm font-semibold">{scan.score === null ? `${scan.progress}%` : `${scan.score}/100`}</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel min-w-28 px-3 py-2">
      <div className="flex items-center gap-2 text-[#667085]">{icon}<span>{label}</span></div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
