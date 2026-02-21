import { api } from "./client.ts";
import type { Skill, SkillSummary, SkillRule } from "./types.ts";

export const skillsApi = {
  list: () => api.get<SkillSummary[]>("/skills"),
  get: (slug: string) => api.get<Skill>(`/skills/${slug}`),
  updateContent: (slug: string, content: string) =>
    api.patch<Skill>(`/skills/${slug}`, { content }),
  updateRule: (slug: string, filename: string, content: string) =>
    api.patch<SkillRule>(`/skills/${slug}/rules/${filename}`, { content }),
  getReference: (slug: string, filename: string) =>
    api.get<{ filename: string; content: string }>(
      `/skills/${slug}/references/${filename}`,
    ),
};
