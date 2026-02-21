import { useState } from "react";
import { cliApi } from "../api/cli.api.ts";
import type { CliResult } from "../api/types.ts";

export default function InstallPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CliResult | null>(null);
  const [installPkg, setInstallPkg] = useState("");
  const [installResult, setInstallResult] = useState<CliResult | null>(null);
  const [updateResult, setUpdateResult] = useState<CliResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function doSearch() {
    setLoading("search");
    setSearchResult(null);
    try {
      const res = await cliApi.find(searchQuery);
      setSearchResult(res);
    } finally {
      setLoading(null);
    }
  }

  async function doInstall() {
    setLoading("install");
    setInstallResult(null);
    try {
      const res = await cliApi.install(installPkg);
      setInstallResult(res);
    } finally {
      setLoading(null);
    }
  }

  async function doCheckUpdates() {
    setLoading("check");
    setUpdateResult(null);
    try {
      const res = await cliApi.checkUpdates();
      setUpdateResult(res);
    } finally {
      setLoading(null);
    }
  }

  async function doUpdateAll() {
    setLoading("update");
    setUpdateResult(null);
    try {
      const res = await cliApi.updateAll();
      setUpdateResult(res);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>find &amp; install skills</h1>
        <p style={styles.subtitle}>
          search and install skills via the npx skills CLI
        </p>
      </div>

      {/* Search */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>SEARCH SKILLS</div>
        <div style={styles.row}>
          <input
            type="text"
            placeholder="search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            style={styles.input}
          />
          <button
            style={styles.btn}
            onClick={doSearch}
            disabled={loading === "search"}
          >
            {loading === "search" ? "searching..." : "search"}
          </button>
        </div>
        {searchResult && <TerminalOutput result={searchResult} />}
      </section>

      {/* Install */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>INSTALL A SKILL</div>
        <div style={styles.row}>
          <input
            type="text"
            placeholder="owner/repo@skill-name or package ref..."
            value={installPkg}
            onChange={(e) => setInstallPkg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doInstall()}
            style={styles.input}
          />
          <button
            style={styles.btnAccent}
            onClick={doInstall}
            disabled={loading === "install" || !installPkg}
          >
            {loading === "install" ? "installing..." : "install"}
          </button>
        </div>
        {installResult && <TerminalOutput result={installResult} />}
      </section>

      {/* Updates */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>UPDATES</div>
        <div style={styles.row}>
          <button
            style={styles.btn}
            onClick={doCheckUpdates}
            disabled={loading === "check"}
          >
            {loading === "check" ? "checking..." : "check for updates"}
          </button>
          <button
            style={styles.btn}
            onClick={doUpdateAll}
            disabled={loading === "update"}
          >
            {loading === "update" ? "updating..." : "update all"}
          </button>
        </div>
        {updateResult && <TerminalOutput result={updateResult} />}
      </section>
    </div>
  );
}

function TerminalOutput({ result }: { result: CliResult }) {
  const text = result.stdout || result.stderr || "(no output)";
  return (
    <div style={styles.terminal}>
      <div style={styles.terminalStatus}>
        <span
          style={{
            color: result.success ? "var(--success)" : "var(--error)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.05em",
          }}
        >
          {result.success ? "✓ success" : "✗ failed"}
        </span>
      </div>
      <pre style={styles.terminalText}>{text}</pre>
    </div>
  );
}

const styles = {
  page: { padding: "32px 40px", maxWidth: "800px" },
  header: { marginBottom: "32px" },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 400,
    color: "var(--text-secondary)",
    letterSpacing: "0.05em",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  section: { marginBottom: "36px" },
  sectionTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--border)",
  },
  row: { display: "flex", gap: "8px", marginBottom: "12px" },
  input: {
    flex: 1,
    padding: "8px 12px",
    fontSize: "12px",
  },
  btn: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "8px 16px",
    border: "1px solid var(--border-strong)",
    color: "var(--text-secondary)",
    background: "transparent",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "border-color 150ms ease",
  },
  btnAccent: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "8px 16px",
    backgroundColor: "var(--accent)",
    color: "#000",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "background-color 150ms ease",
  },
  terminal: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  terminalStatus: {
    padding: "6px 12px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--bg-raised)",
  },
  terminalText: {
    padding: "12px 16px",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    maxHeight: "300px",
    overflow: "auto",
    margin: 0,
  },
};
