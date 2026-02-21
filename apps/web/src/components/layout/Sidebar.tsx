import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSkills } from "../../hooks/useSkills.ts";
import type { SkillSummary } from "../../api/types.ts";

export default function Sidebar() {
  const { data: skills, isLoading, error } = useSkills();
  const { slug: activeSlug } = useParams<{ slug?: string }>();
  const [search, setSearch] = useState("");

  const filtered = skills?.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside style={styles.sidebar}>
      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="filter skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      <div style={styles.list}>
        {isLoading && <span style={styles.hint}>loading...</span>}
        {error && <span style={{ ...styles.hint, color: "var(--error)" }}>failed to load</span>}
        {filtered?.map((skill, i) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            active={skill.id === activeSlug}
            index={i}
          />
        ))}
        {filtered?.length === 0 && !isLoading && (
          <span style={styles.hint}>no skills found</span>
        )}
      </div>
    </aside>
  );
}

function SkillListItem({
  skill,
  active,
  index,
}: {
  skill: SkillSummary;
  active: boolean;
  index: number;
}) {
  return (
    <Link
      to={`/skills/${skill.id}`}
      style={{
        ...styles.item,
        backgroundColor: active ? "var(--bg-raised)" : "transparent",
        borderLeft: active
          ? "3px solid var(--accent)"
          : "3px solid transparent",
        animationDelay: `${index * 30}ms`,
      }}
      className="stagger-item"
    >
      <span style={styles.itemName}>{skill.name}</span>
      <span style={styles.itemDesc}>{skill.description}</span>
      <div style={styles.itemMeta}>
        {skill.ruleCount > 0 && (
          <span style={styles.badge}>{skill.ruleCount} rules</span>
        )}
        {skill.referenceCount > 0 && (
          <span style={styles.badge}>{skill.referenceCount} refs</span>
        )}
      </div>
    </Link>
  );
}

const styles = {
  sidebar: {
    width: "var(--sidebar-width)",
    backgroundColor: "var(--bg-surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column" as const,
    flexShrink: 0,
    overflow: "hidden",
  },
  searchWrap: {
    padding: "12px",
    borderBottom: "1px solid var(--border)",
  },
  search: {
    width: "100%",
    padding: "6px 10px",
    fontSize: "12px",
  },
  list: {
    flex: 1,
    overflow: "auto",
    padding: "4px 0",
  },
  item: {
    display: "block",
    padding: "10px 14px",
    textDecoration: "none",
    borderBottom: "1px solid var(--border)",
    transition: "background-color 150ms ease, border-left-color 150ms ease",
    cursor: "pointer",
  },
  itemName: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--text-primary)",
    marginBottom: "2px",
  },
  itemDesc: {
    display: "block",
    fontSize: "11px",
    color: "var(--text-secondary)",
    marginBottom: "6px",
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  itemMeta: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
  },
  badge: {
    display: "inline-block",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    padding: "1px 5px",
    backgroundColor: "var(--bg-raised)",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
  },
  hint: {
    display: "block",
    padding: "16px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-muted)",
  },
};
