import { z } from "zod";

export const planMetricsQuerySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).default(24),
});

export type PlanMetricsQuery = z.infer<typeof planMetricsQuerySchema>;
