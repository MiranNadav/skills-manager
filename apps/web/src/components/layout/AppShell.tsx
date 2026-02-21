import type { ReactNode } from "react";
import Sidebar from "./Sidebar.tsx";
import TopBar from "./TopBar.tsx";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={styles.shell}>
      <TopBar />
      <div style={styles.body}>
        <Sidebar />
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    overflow: "hidden",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "var(--bg-base)",
  },
};
