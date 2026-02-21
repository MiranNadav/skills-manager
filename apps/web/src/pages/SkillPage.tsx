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
      <UsageSection usage={usage} />

      {/* Content */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SKILL.md</div>
        {editMode ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={styles.editor}
          />
        ) : (
          <div style={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {skill.content || "*No content*"}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Rules */}
      {skill.rules.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>RULES ({skill.rules.length})</div>
          {skill.rules.map((rule) => (
            <RuleItem key={rule.filename} rule={rule} slug={slug ?? ""} />
          ))}
        </div>
      )}

      {/* Reference files */}
      {skill.referenceFiles.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>REFERENCES</div>
          <div style={styles.refList}>
            {skill.referenceFiles.map((f) => (
              <span key={f} style={styles.refFile}>{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
          <span
            style={{
              ...styles.ruleImpact,
              color: impactColor(impact),
            }}
          >
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
            <div style={styles.markdown}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rule.body}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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


function UsageSection({ usage }: { usage: SkillUsageStats | undefined }) {
  if (!usage) return null;

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
    <div style={styles.section}>
      <div style={styles.sectionTitle}>
        USAGE
        <span style={styles.usageHeader}>
          {usage.count === 0
            ? "never used"
            : `${usage.count} ${usage.count === 1 ? "use" : "uses"} · last used ${formatDate(usage.lastUsed ?? "")}`}
        </span>
      </div>
      {usage.count === 0 ? (
        <p style={styles.usageEmpty}>no usage recorded in ~/.claude/projects</p>
      ) : (
        <div style={styles.invocationList}>
          {usage.invocations.map((inv: SkillInvocation, i: number) => (
            <InvocationItem key={i} inv={inv} />
          ))}
        </div>
      )}
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
      {inv.prompt && (
        <p style={styles.invocationPrompt}>{inv.prompt}</p>
      )}
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
    marginBottom: "24px",
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
  section: { marginBottom: "32px" },
  sectionTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    marginBottom: "12px",
    paddingBottom: "6px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  markdown: {
    fontSize: "13px",
    lineHeight: 1.7,
    color: "var(--text-primary)",
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
  rule: {
    borderBottom: "1px solid var(--border)",
    marginBottom: "0",
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
  refList: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  refFile: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
    padding: "4px 8px",
    border: "1px solid var(--border)",
  },
  usageHeader: {
    fontWeight: 400,
    color: "var(--text-muted)",
    fontSize: "9px",
    letterSpacing: "0.05em",
  },
  usageEmpty: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-muted)",
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
};
