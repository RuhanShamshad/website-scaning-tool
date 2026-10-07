import { Worker } from "bullmq";
import { getRedisConnection, scanQueueName, type ScanJobData } from "@/lib/queue/scans";
import { runScan } from "@/lib/scanner/engine";

const worker = new Worker<ScanJobData>(
  scanQueueName,
  async (job) => {
    await runScan(job.data.scanId);
  },
  {
    connection: getRedisConnection(),
    concurrency: Number(process.env.SCAN_WORKER_CONCURRENCY ?? 1)
  }
);

worker.on("completed", (job) => {
  console.log(`Scan job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Scan job failed: ${job?.id}`, error);
});

console.log(`Scan worker listening on queue "${scanQueueName}"`);
