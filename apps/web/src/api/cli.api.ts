import { api } from "./client.ts";
import type { CliResult } from "./types.ts";

export const cliApi = {
  find: (q: string) => api.get<CliResult>(`/cli/find?q=${encodeURIComponent(q)}`),
  install: (pkg: string) => api.post<CliResult>("/cli/install", { package: pkg }),
  checkUpdates: () => api.get<CliResult>("/cli/updates"),
  updateAll: () => api.post<CliResult>("/cli/update"),
};
