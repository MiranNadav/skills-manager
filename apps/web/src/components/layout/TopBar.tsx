import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "[ SKILLS ]" },
  { to: "/analysis", label: "[ ANALYSIS ]" },
  { to: "/install", label: "[ INSTALL ]" },
];

export default function TopBar() {
  const { pathname } = useLocation();

  return (
    <header style={styles.bar}>
      <span style={styles.brand}>
        <span style={styles.accent}>▸</span> SKILLS MANAGER
      </span>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ to, label }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                ...styles.navItem,
                color: active ? "var(--accent)" : "var(--text-secondary)",
                borderBottom: active ? "1px solid var(--accent)" : "1px solid transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

const styles = {
  bar: {
    height: "var(--topbar-height)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    backgroundColor: "var(--bg-surface)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  brand: {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--text-primary)",
    letterSpacing: "0.1em",
  },
  accent: {
    color: "var(--accent)",
    marginRight: "6px",
  },
  nav: {
    display: "flex",
    gap: "4px",
  },
  navItem: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.05em",
    padding: "4px 8px",
    textDecoration: "none",
    transition: "color 150ms ease",
  },
};
