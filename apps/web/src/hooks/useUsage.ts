import { useQuery } from "@tanstack/react-query";
import { usageApi } from "../api/usage.api.ts";

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: usageApi.list,
  });
}

export function useSkillUsage(slug: string) {
  return useQuery({
    queryKey: ["usage", slug],
    queryFn: () => usageApi.get(slug),
    enabled: Boolean(slug),
  });
}
