import { z } from "zod";

export const scanRequestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  scanType: z.enum(["quick", "full"]).default("quick"),
  maxPages: z.coerce.number().int().min(1).max(100).default(1)
});

export type ScanRequestInput = z.infer<typeof scanRequestSchema>;
