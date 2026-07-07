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

export const collectorStartSchema = z.object({
  source: z.enum(["pracuj", "justjoinit", "rocketjobs", "nofluffjobs"]),
  phrase: z.string().min(1),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  pageLimit: z.number().int().min(1).max(50).optional(),
  resultLimit: z.number().int().min(1).max(500).optional()
});

export const collectorRunIdSchema = z.string().min(1);

export const candidateProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cvFilePath: z.string().optional(),
  coverLetter: z.string().optional(),
  expectedSalary: z.string().optional(),
  noticePeriod: z.string().optional(),
  consent: z.boolean().optional()
});

export const rapidApplyPrepareSchema = z.object({
  offerId: z.string().min(1),
  attemptId: z.string().optional(),
  candidate: candidateProfileSchema,
  confirmationChecked: z.boolean().optional()
});

export const rapidApplySubmitSchema = rapidApplyPrepareSchema.extend({
  attemptId: z.string().min(1),
  confirmationChecked: z.boolean()
});
