import { api } from "./client.ts";
import type {
  SkillSummaryResult,
  DuplicatesResult,
  ConnectionsResult,
} from "./types.ts";

export const analysisApi = {
  summarize: (slug: string) =>
    api.post<SkillSummaryResult>(`/analysis/summary/${slug}`),
  findDuplicates: () => api.post<DuplicatesResult>("/analysis/duplicates"),
  findConnections: () => api.post<ConnectionsResult>("/analysis/connections"),
};
