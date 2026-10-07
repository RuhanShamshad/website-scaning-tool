import { Queue } from "bullmq";
import IORedis from "ioredis";

export const scanQueueName = "scan.run";

export type ScanJobData = {
  scanId: string;
  workspaceId: string;
};

let connection: IORedis | null = null;
let queue: Queue<ScanJobData> | null = null;

export function getRedisConnection(): IORedis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required for scan queue operations.");
  }

  connection ??= new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

  return connection;
}

export function getScanQueue(): Queue<ScanJobData> {
  queue ??= new Queue<ScanJobData>(scanQueueName, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
      removeOnFail: { age: 60 * 60 * 24 * 7 }
    }
  });

  return queue;
}

export async function enqueueScan(data: ScanJobData): Promise<void> {
  await getScanQueue().add("run", data, { jobId: data.scanId });
}
