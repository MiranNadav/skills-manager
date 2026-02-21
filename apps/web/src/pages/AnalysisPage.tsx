import { useState } from "react";
import { analysisApi } from "../api/analysis.api.ts";
import type { DuplicatesResult, ConnectionsResult } from "../api/types.ts";

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; duplicates: DuplicatesResult; connections: ConnectionsResult };

export default function AnalysisPage() {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setState({ status: "loading" });
    setError(null);
    try {
      const [duplicates, connections] = await Promise.all([
        analysisApi.findDuplicates(),
        analysisApi.findConnections(),
      ]);
      setState({ status: "done", duplicates, connections });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setState({ status: "idle" });
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>ai analysis</h1>
        <p style={styles.subtitle}>
          detect duplicates and thematic connections across your skill library
        </p>
      </div>

      <div style={styles.ctaSection}>
        <button
          style={{
            ...styles.runBtn,
            opacity: state.status === "loading" ? 0.6 : 1,
            cursor: state.status === "loading" ? "not-allowed" : "pointer",
          }}
          onClick={runAnalysis}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? "▸ analyzing..." : "▸ run analysis"}
        </button>
        {error && <span style={styles.errorMsg}>{error}</span>}
      </div>

      {state.status === "done" && (
        <>
          {/* Duplicates */}
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              DUPLICATE DETECTION
              <span style={styles.meta}>
                {state.duplicates.skillsAnalyzed} skills analyzed via {state.duplicates.provider}
              </span>
            </div>
            {state.duplicates.duplicates.length === 0 ? (
              <p style={styles.empty}>No significant duplicates found.</p>
            ) : (
              state.duplicates.duplicates.map((d, i) => (
                <div key={i} style={styles.duplicateCard}>
                  <div style={styles.duplicatePair}>
                    <span style={styles.skillRef}>{d.skill1}</span>
                    <span style={styles.vs}>↔</span>
                    <span style={styles.skillRef}>{d.skill2}</span>
                    <span
                      style={{
                        ...styles.similarity,
                        color: similarityColor(d.similarity),
                      }}
                    >
                      [{d.similarity}]
                    </span>
                  </div>
                  <p style={styles.explanation}>{d.explanation}</p>
                </div>
              ))
            )}
          </section>

          {/* Connections */}
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              THEMATIC CONNECTIONS
              <span style={styles.meta}>
                {state.connections.skillsAnalyzed} skills analyzed via {state.connections.provider}
              </span>
            </div>
            {state.connections.connections.length === 0 ? (
              <p style={styles.empty}>No connections found.</p>
            ) : (
              <div style={styles.clusters}>
                {state.connections.connections.map((c, i) => (
                  <div key={i} style={styles.cluster}>
                    <div style={styles.clusterTheme}>{c.theme}</div>
                    <div style={styles.clusterSkills}>
                      {c.skills.map((s) => (
                        <span key={s} style={styles.clusterSkill}>{s}</span>
                      ))}
                    </div>
                    <p style={styles.clusterDesc}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function similarityColor(s: string) {
  if (s === "high") return "var(--error)";
  if (s === "medium") return "var(--warning)";
  return "var(--text-muted)";
}

const styles = {
  page: { padding: "32px 40px", maxWidth: "900px" },
  header: { marginBottom: "28px" },
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
  ctaSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "36px",
  },
  runBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "10px 24px",
    backgroundColor: "var(--accent)",
    color: "#000",
    border: "none",
    letterSpacing: "0.05em",
    transition: "background-color 150ms ease",
  },
  errorMsg: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--error)",
  },
  section: { marginBottom: "40px" },
  sectionTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meta: {
    fontWeight: 400,
    color: "var(--text-muted)",
    fontSize: "9px",
    letterSpacing: "0.05em",
  },
  empty: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--success)",
  },
  duplicateCard: {
    padding: "14px 16px",
    borderLeft: "3px solid var(--border-strong)",
    marginBottom: "12px",
    backgroundColor: "var(--bg-surface)",
  },
  duplicatePair: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
    flexWrap: "wrap" as const,
  },
  skillRef: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  vs: {
    color: "var(--text-muted)",
    fontSize: "12px",
  },
  similarity: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "0.05em",
    marginLeft: "auto",
  },
  explanation: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  clusters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "12px",
  },
  cluster: {
    padding: "14px 16px",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border)",
  },
  clusterTheme: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--accent)",
    marginBottom: "8px",
    letterSpacing: "0.05em",
  },
  clusterSkills: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
    marginBottom: "8px",
  },
  clusterSkill: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    padding: "2px 6px",
    backgroundColor: "var(--bg-raised)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  },
  clusterDesc: {
    fontSize: "11px",
    color: "var(--text-muted)",
    lineHeight: 1.4,
  },
};
