import { z } from "zod";

export const offerListQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  decision: z.enum(["apply", "maybe", "skip"]).optional()
});

export const createOfferSchema = z.object({
  source: z.string().min(1),
  url: z.string().url(),
  title: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salaryRaw: z.string().nullable().optional(),
  technologies: z.array(z.string()).optional(),
  description: z.string().nullable().optional()
});

export const queueListQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  status: z.enum(["pending", "sent", "skipped"]).optional()
});

export const skipQueueSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1)
});

export const idSchema = z.string().min(1);

export const classifyUrlSchema = z.object({
  source: z.string().min(1),
  url: z.string().url(),
  text: z.string().default("")
});
