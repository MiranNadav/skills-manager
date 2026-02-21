import { useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsApi } from "../api/skills.api.ts";

export function useSaveSkill(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => skillsApi.updateContent(slug, content),
    onSuccess: (updated) => {
      queryClient.setQueryData(["skills", slug], updated);
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useSaveRule(slug: string, filename: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => skillsApi.updateRule(slug, filename, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills", slug] });
    },
  });
}
