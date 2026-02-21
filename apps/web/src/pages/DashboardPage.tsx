import { Link } from "react-router-dom";
import { useSkills } from "../hooks/useSkills.ts";
import { useUsage } from "../hooks/useUsage.ts";
import type { SkillSummary } from "../api/types.ts";

export default function DashboardPage() {
  const { data: skills, isLoading, error } = useSkills();
  const { data: usageStats } = useUsage();

  if (isLoading) return <Placeholder text="loading skills..." />;
  if (error) return <Placeholder text={`error: ${error.message}`} error />;
  if (!skills?.length) return <Placeholder text="no skills found at SKILLS_PATH" />;

  const withRules = skills.filter((s) => s.ruleCount > 0).length;
  const withRefs = skills.filter((s) => s.referenceCount > 0).length;

  // Build a usage map for quick lookup
  const usageMap = new Map<string, number>();
  let mostUsed: { id: string; count: number } | null = null;
  if (usageStats) {
    for (const u of usageStats) {
      usageMap.set(u.skillId, u.count);
      if (!mostUsed || u.count > mostUsed.count) {
        mostUsed = { id: u.skillId, count: u.count };
      }
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>installed skills</h1>
        <div style={styles.stats}>
          <Stat label="total" value={skills.length} />
          <Stat label="with rules" value={withRules} />
          <Stat label="with refs" value={withRefs} />
          {mostUsed && <Stat label="most used" value={mostUsed.count} caption={mostUsed.id} />}
        </div>
      </div>

      <div style={styles.actions}>
        <Link to="/analysis" style={styles.actionBtn}>
          ▸ run analysis
        </Link>
        <Link to="/install" style={styles.actionBtn}>
          ▸ find &amp; install
        </Link>
      </div>

      <div style={styles.grid}>
        {skills.map((skill, i) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            index={i}
            usageCount={usageMap.get(skill.id) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

function SkillCard({
  skill,
  index,
  usageCount,
}: {
  skill: SkillSummary;
  index: number;
  usageCount: number;
}) {
  return (
    <Link
      to={`/skills/${skill.id}`}
      style={styles.card}
      className="stagger-item"
    >
      <div
        style={{
          ...styles.cardInner,
          animationDelay: `${index * 40}ms`,
        }}
      >
        <div style={styles.cardId}>{skill.id}</div>
        <div style={styles.cardName}>{skill.name}</div>
        <div style={styles.cardDesc}>{skill.description}</div>
        <div style={styles.cardMeta}>
          {usageCount > 0 && (
            <span style={{ ...styles.tag, color: "var(--accent)" }}>
              [{usageCount} {usageCount === 1 ? "use" : "uses"}]
            </span>
          )}
          {skill.ruleCount > 0 && (
            <span style={styles.tag}>[{skill.ruleCount} rules]</span>
          )}
          {skill.referenceCount > 0 && (
            <span style={styles.tag}>[{skill.referenceCount} refs]</span>
          )}
          {skill.hasAgentsMd && <span style={styles.tag}>[AGENTS.md]</span>}
        </div>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption?: string;
}) {
  return (
    <div style={styles.stat}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
      {caption && (
        <span style={{ ...styles.statLabel, color: "var(--text-muted)", marginTop: "1px" }}>
          {caption}
        </span>
      )}
    </div>
  );
}

function Placeholder({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <div style={styles.placeholder}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: error ? "var(--error)" : "var(--text-muted)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px 40px",
    maxWidth: "1100px",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 400,
    color: "var(--text-secondary)",
    letterSpacing: "0.05em",
  },
  stats: {
    display: "flex",
    gap: "24px",
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "22px",
    fontWeight: 600,
    color: "var(--accent)",
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    marginTop: "2px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginBottom: "28px",
  },
  actionBtn: {
    display: "inline-block",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "6px 14px",
    border: "1px solid var(--border-strong)",
    color: "var(--text-secondary)",
    textDecoration: "none",
    transition: "border-color 150ms ease, color 150ms ease",
    letterSpacing: "0.05em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1px",
    backgroundColor: "var(--border)",
  },
  card: {
    display: "block",
    textDecoration: "none",
    backgroundColor: "var(--bg-surface)",
    transition: "background-color 150ms ease",
  },
  cardInner: {
    padding: "20px",
    borderLeft: "3px solid transparent",
    transition: "border-left-color 150ms ease",
  },
  cardId: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },
  cardName: {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
    marginBottom: "6px",
  },
  cardDesc: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: "12px",
    display: "-webkit-box" as unknown as string,
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  cardMeta: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
  },
  tag: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "40vh",
  },
};
