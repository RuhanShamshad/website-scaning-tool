"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RescanButton({ scanId }: { scanId: string }) {
  const router = useRouter();

  async function rescan() {
    const response = await fetch(`/api/scans/${scanId}/rescan`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) router.push(`/scans/${payload.scanId}`);
  }

  return (
    <Button type="button" onClick={rescan}>
      <RefreshCw size={16} />
      Re-scan
    </Button>
  );
}
