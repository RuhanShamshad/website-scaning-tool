"use client";

import { useEffect, useState } from "react";

export function ScanProgress({ scanId, initialStatus, initialProgress }: { scanId: string; initialStatus: string; initialProgress: number }) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") return;

    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/scans/${scanId}`);
      if (!response.ok) return;
      const scan = await response.json();
      setStatus(scan.status);
      setProgress(scan.progress);
      if (scan.status === "COMPLETED" || scan.status === "FAILED") {
        window.location.reload();
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [scanId, status]);

  return (
    <div className="mt-5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{status.replaceAll("_", " ")}</span>
        <span className="text-[#667085]">{progress}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9edf5]">
        <div className="h-full rounded-full bg-[#2358ff] transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
