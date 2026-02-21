import { useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSkill } from "../hooks/useSkill.ts";
import { useSaveSkill, useSaveRule } from "../hooks/useSaveSkill.ts";
import { useSkillUsage } from "../hooks/useUsage.ts";
import { analysisApi } from "../api/analysis.api.ts";
import type { SkillRule, SkillUsageStats, SkillInvocation } from "../api/types.ts";

export default function SkillPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: skill, isLoading, error } = useSkill(slug ?? "");
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const saveMutation = useSaveSkill(slug ?? "");
  const { data: usage } = useSkillUsage(slug ?? "");

  if (isLoading) return <Msg text="loading..." />;
  if (error) return <Msg text={`error: ${error.message}`} />;
  if (!skill) return <Msg text="skill not found" />;

  function startEdit() {
    setEditContent(skill!.rawContent);
    setEditMode(true);
  }

  async function saveEdit() {
    await saveMutation.mutateAsync(editContent);
    setEditMode(false);
  }

  async function generateSummary() {
    if (!slug) return;
    setSummarizing(true);
    try {
      const result = await analysisApi.summarize(slug);
      setSummary(result.summary);
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.slug}>{skill.id}</div>
          <h1 style={styles.name}>{skill.name}</h1>
          <p style={styles.desc}>{skill.description}</p>
        </div>
        <div style={styles.actions}>
          {editMode ? (
            <>
              <button
                style={styles.btnPrimary}
                onClick={saveEdit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "saving..." : "save"}
              </button>
              <button style={styles.btnSecondary} onClick={() => setEditMode(false)}>
                cancel
              </button>
            </>
          ) : (
            <>
              <button style={styles.btnSecondary} onClick={startEdit}>
                edit
              </button>
              <button
                style={styles.btnSecondary}
                onClick={generateSummary}
                disabled={summarizing}
              >
                {summarizing ? "generating..." : "ai summary"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div style={styles.summary}>
          <span style={styles.summaryLabel}>AI SUMMARY</span>
          <p style={styles.summaryText}>{summary}</p>
        </div>
      )}

      {/* Metadata */}
      <div style={styles.meta}>
        <MetaItem label="path" value={skill.skillPath} />
        <MetaItem label="rules" value={String(skill.rules.length)} />
        <MetaItem label="references" value={String(skill.referenceFiles.length)} />
        {skill.hasAgentsMd && <MetaItem label="AGENTS.md" value="present" />}
      </div>

      {/* Usage */}
      {usage && usage.count > 0 && (
        <CollapsibleSection
          title="USAGE"
          badge={`${usage.count} ${usage.count === 1 ? "use" : "uses"}`}
          defaultOpen={false}
        >
          <UsageContent usage={usage} />
        </CollapsibleSection>
      )}

      {/* Content */}
      <CollapsibleSection
        title="SKILL.md"
        defaultOpen={true}
        actions={
          !editMode ? (
            <button style={styles.btnSmall} onClick={startEdit}>
              edit
            </button>
          ) : undefined
        }
      >
        {editMode ? (
          <>
            <div style={styles.editorActions}>
              <button
                style={styles.btnSmall}
                onClick={saveEdit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "saving..." : "save"}
              </button>
              <button style={styles.btnSmall} onClick={() => setEditMode(false)}>
                cancel
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={styles.editor}
            />
          </>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {skill.content || "*No content*"}
            </ReactMarkdown>
          </div>
        )}
      </CollapsibleSection>

      {/* Rules */}
      {skill.rules.length > 0 && (
        <CollapsibleSection
          title="RULES"
          badge={String(skill.rules.length)}
          defaultOpen={true}
        >
          <div style={styles.ruleList}>
            {skill.rules.map((rule) => (
              <RuleItem key={rule.filename} rule={rule} slug={slug ?? ""} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Reference files */}
      {skill.referenceFiles.length > 0 && (
        <CollapsibleSection
          title="REFERENCES"
          badge={String(skill.referenceFiles.length)}
          defaultOpen={false}
        >
          <div style={styles.refList}>
            {skill.referenceFiles.map((f) => (
              <span key={f} style={styles.refFile}>{f}</span>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ── Shared collapsible section ────────────────────────────────────

function CollapsibleSection({
  title,
  badge,
  defaultOpen,
  actions,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={styles.collapsible}>
      <div style={styles.collapsibleHeader} onClick={() => setOpen((o) => !o)}>
        <span style={styles.colToggle}>{open ? "▾" : "▸"}</span>
        <span style={styles.colTitle}>{title}</span>
        {badge && <span style={styles.colBadge}>{badge}</span>}
        <div style={styles.colSpacer} />
        {actions && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={styles.colActions}
          >
            {actions}
          </div>
        )}
      </div>
      {open && <div style={styles.collapsibleBody}>{children}</div>}
    </div>
  );
}

// ── Rule item ─────────────────────────────────────────────────────

function RuleItem({ rule, slug }: { rule: SkillRule; slug: string }) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(rule.content);
  const saveMutation = useSaveRule(slug, rule.filename);

  async function save() {
    await saveMutation.mutateAsync(content);
    setEditMode(false);
  }

  const impact = (rule.frontmatter["impact"] as string | undefined) ?? "";
  const title = (rule.frontmatter["title"] as string | undefined) ?? rule.filename;

  return (
    <div style={styles.rule}>
      <div style={styles.ruleHeader} onClick={() => setOpen((o) => !o)}>
        <span style={styles.ruleToggle}>{open ? "▾" : "▸"}</span>
        <span style={styles.ruleFilename}>{rule.filename}</span>
        <span style={styles.ruleTitle}>{title !== rule.filename ? title : ""}</span>
        {impact && (
          <span style={{ ...styles.ruleImpact, color: impactColor(impact) }}>
            {impact}
          </span>
        )}
      </div>
      {open && (
        <div style={styles.ruleBody}>
          <div style={styles.ruleActions}>
            {editMode ? (
              <>
                <button style={styles.btnSmall} onClick={save} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "saving..." : "save"}
                </button>
                <button style={styles.btnSmall} onClick={() => setEditMode(false)}>cancel</button>
              </>
            ) : (
              <button
                style={styles.btnSmall}
                onClick={() => {
                  setContent(rule.content);
                  setEditMode(true);
                }}
              >
                edit
              </button>
            )}
          </div>
          {editMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ ...styles.editor, minHeight: "200px" }}
            />
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rule.body}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Usage section ─────────────────────────────────────────────────

function UsageContent({ usage }: { usage: SkillUsageStats }) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      {usage.lastUsed && (
        <p style={styles.usageLastUsed}>
          last used {formatDate(usage.lastUsed)}
        </p>
      )}
      <div style={styles.invocationList}>
        {usage.invocations.map((inv: SkillInvocation, i: number) => (
          <InvocationItem key={i} inv={inv} />
        ))}
      </div>
    </div>
  );
}

function InvocationItem({ inv }: { inv: SkillInvocation }) {
  const date = (() => {
    try {
      return new Date(inv.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return inv.timestamp;
    }
  })();

  return (
    <div style={styles.invocation}>
      <div style={styles.invocationMeta}>
        <span style={styles.invocationDate}>{date}</span>
        <span style={styles.invocationProject}>{inv.project}</span>
      </div>
      {inv.prompt && <p style={styles.invocationPrompt}>{inv.prompt}</p>}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}:</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function Msg({ text }: { text: string }) {
  return (
    <div style={{ padding: "40px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
      {text}
    </div>
  );
}

function impactColor(impact: string): string {
  const u = impact.toUpperCase();
  if (u === "CRITICAL") return "var(--error)";
  if (u === "HIGH") return "var(--warning)";
  if (u === "MEDIUM") return "var(--text-primary)";
  return "var(--text-muted)";
}

// ── Styles ────────────────────────────────────────────────────────

const styles = {
  page: { padding: "32px 40px", maxWidth: "900px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    gap: "24px",
  },
  slug: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--accent)",
    letterSpacing: "0.1em",
    marginBottom: "4px",
  },
  name: {
    fontSize: "24px",
    fontWeight: 500,
    marginBottom: "6px",
  },
  desc: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  actions: { display: "flex", gap: "8px", flexShrink: 0 },
  btnPrimary: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "6px 14px",
    backgroundColor: "var(--accent)",
    color: "#000",
    border: "none",
    cursor: "pointer",
    transition: "background-color 150ms ease",
  },
  btnSecondary: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "6px 14px",
    border: "1px solid var(--border-strong)",
    color: "var(--text-secondary)",
    background: "transparent",
    cursor: "pointer",
    transition: "border-color 150ms ease, color 150ms ease",
  },
  btnSmall: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    padding: "3px 8px",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    background: "transparent",
    cursor: "pointer",
  },
  summary: {
    padding: "14px 18px",
    backgroundColor: "var(--accent-dim)",
    border: "1px solid rgba(232,255,0,0.2)",
    marginBottom: "20px",
  },
  summaryLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--accent)",
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: "6px",
  },
  summaryText: {
    fontSize: "13px",
    color: "var(--text-primary)",
    lineHeight: 1.6,
  },
  meta: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap" as const,
    padding: "12px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
    marginBottom: "20px",
  },
  metaItem: { display: "flex", gap: "6px", alignItems: "baseline" },
  metaLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
  },
  metaValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  // Collapsible section
  collapsible: {
    marginBottom: "4px",
    border: "1px solid var(--border)",
  },
  collapsibleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    backgroundColor: "var(--bg-raised)",
    userSelect: "none" as const,
    transition: "background-color 150ms ease",
  },
  colToggle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--accent)",
    flexShrink: 0,
    width: "10px",
  },
  colTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
  },
  colBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "var(--text-muted)",
    padding: "1px 5px",
    border: "1px solid var(--border)",
    letterSpacing: "0.04em",
  },
  colSpacer: { flex: 1 },
  colActions: { display: "flex", gap: "6px" },
  collapsibleBody: {
    padding: "16px 18px",
    borderTop: "1px solid var(--border)",
    backgroundColor: "var(--bg-surface)",
  },
  editorActions: {
    display: "flex",
    gap: "6px",
    marginBottom: "10px",
    justifyContent: "flex-end",
  },
  editor: {
    width: "100%",
    minHeight: "400px",
    padding: "16px",
    fontSize: "12px",
    lineHeight: 1.6,
    resize: "vertical" as const,
    border: "1px solid var(--border-strong)",
  },
  // Rules
  ruleList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
    border: "1px solid var(--border)",
  },
  rule: {
    borderBottom: "1px solid var(--border)",
  },
  ruleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background-color 150ms ease",
  },
  ruleToggle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--accent)",
    flexShrink: 0,
  },
  ruleFilename: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    flexShrink: 0,
  },
  ruleTitle: {
    fontSize: "12px",
    color: "var(--text-primary)",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  ruleImpact: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "0.08em",
    flexShrink: 0,
  },
  ruleBody: {
    padding: "12px 16px 16px",
    borderTop: "1px solid var(--border)",
    backgroundColor: "var(--bg-raised)",
  },
  ruleActions: {
    display: "flex",
    gap: "6px",
    marginBottom: "10px",
    justifyContent: "flex-end",
  },
  // Usage
  usageLastUsed: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    marginBottom: "10px",
  },
  invocationList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
    backgroundColor: "var(--border)",
  },
  invocation: {
    padding: "10px 14px",
    backgroundColor: "var(--bg-surface)",
    borderLeft: "3px solid var(--border-strong)",
  },
  invocationMeta: {
    display: "flex",
    gap: "12px",
    alignItems: "baseline",
    marginBottom: "4px",
  },
  invocationDate: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    flexShrink: 0,
  },
  invocationProject: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--accent)",
    flexShrink: 0,
  },
  invocationPrompt: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    margin: 0,
  },
  // References
  refList: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  refFile: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    padding: "4px 8px",
    border: "1px solid var(--border)",
  },
};
