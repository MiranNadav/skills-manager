import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "../api/skills.api.ts";

export function useSkill(slug: string) {
  return useQuery({
    queryKey: ["skills", slug],
    queryFn: () => skillsApi.get(slug),
    enabled: !!slug,
  });
}
