"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scanType, setScanType] = useState("quick");
  const [maxPages, setMaxPages] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function submitScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, scanType, maxPages: Number(maxPages) })
    });

    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to start scan.");
      return;
    }

    router.push(`/scans/${payload.scanId}`);
  }

  return (
    <form onSubmit={submitScan} className="grid gap-4 lg:grid-cols-[1fr_170px_150px_auto] lg:items-end">
      <label className="grid gap-2 text-sm font-medium">
        Website URL
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Scan type
        <select className="h-10 rounded-md border border-[#d9dee8] bg-white px-3 text-sm" value={scanType} onChange={(event) => setScanType(event.target.value)}>
          <option value="quick">Quick scan</option>
          <option value="full" disabled>Full scan (next phase)</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Max pages
        <select className="h-10 rounded-md border border-[#d9dee8] bg-white px-3 text-sm" value={maxPages} onChange={(event) => setMaxPages(event.target.value)}>
          {[1, 5, 10, 25, 50, 100].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      <Button disabled={isSubmitting} className="w-full lg:w-auto">
        <Play size={16} />
        {isSubmitting ? "Starting" : "Scan Website"}
      </Button>
      {error ? <p className="lg:col-span-4 text-sm font-medium text-red-700">{error}</p> : null}
    </form>
  );
}
