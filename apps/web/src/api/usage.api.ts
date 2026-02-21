import { api } from "./client.ts";
import type { SkillUsageStats } from "./types.ts";

export const usageApi = {
  list: () => api.get<SkillUsageStats[]>("/usage"),
  get: (slug: string) => api.get<SkillUsageStats>(`/usage/${slug}`),
};
