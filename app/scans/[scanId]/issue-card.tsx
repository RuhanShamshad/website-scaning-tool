"use client";

import { useState } from "react";
import type { Issue } from "@prisma/client";
import { Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IssueCard({ issue }: { issue: Issue }) {
  const [status, setStatus] = useState(issue.status);

  async function updateStatus(nextStatus: "FIXED" | "IGNORED") {
    const response = await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (response.ok) setStatus(nextStatus);
  }

  const viewport = issue.viewport as { width?: number; height?: number; label?: string } | null;

  return (
    <article className="rounded-md border border-[#d9dee8] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="badge">{issue.severity}</span>
            <span className="badge">{issue.category}</span>
            {viewport?.width ? <span className="badge">{viewport.label ?? `${viewport.width}px`}</span> : null}
            <span className="badge">{status}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold">{issue.title}</h3>
          <p className="mt-1 break-all text-sm text-[#667085]">{issue.pageUrl}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" className="h-9 bg-[#157347] px-3 hover:bg-[#0f5b37]" onClick={() => updateStatus("FIXED")}>
            <Check size={15} />Fixed
          </Button>
          <Button type="button" className="h-9 bg-[#4b5563] px-3 hover:bg-[#374151]" onClick={() => updateStatus("IGNORED")}>
            <EyeOff size={15} />Ignore
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">What happened</p>
          <p className="mt-1 text-sm leading-6 text-[#344054]">{issue.description}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Recommended fix</p>
          <p className="mt-1 text-sm leading-6 text-[#344054]">{issue.recommendation}</p>
        </div>
      </div>
      <details className="mt-4 rounded-md bg-[#f3f5fa] p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Technical details</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify({ selector: issue.selector, confidence: issue.confidence, details: issue.technicalDetails }, null, 2)}</pre>
      </details>
    </article>
  );
}
