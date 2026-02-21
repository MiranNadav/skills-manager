import { useQuery } from "@tanstack/react-query";
import { skillsApi } from "../api/skills.api.ts";

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: skillsApi.list,
  });
}
