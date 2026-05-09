import React from "react";
import { useRouter } from "next/router";

const linkStyle = {
  fontSize: "var(--text-sm)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--text-secondary)",
  textDecoration: "none",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-md)",
  background: "none",
  border: "none",
  cursor: "pointer",
  transition: "background-color var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out)",
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
};

function NavLink({ children, onClick, ariaLabel }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...linkStyle,
        backgroundColor: hover ? "var(--gray-100)" : "transparent",
        color: hover ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function PyroWordmark() {
  return (
    <span
      aria-label="Pyro"
      style={{
        fontFamily: "var(--font-pyro), var(--font-display), var(--font-sans)",
        fontSize: "var(--text-xl)",
        fontWeight: 700,
        color: "var(--text-primary)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        display: "inline-block",
        transform: "translateY(2px)",
      }}
    >
      Pyro
    </span>
  );
}

export const NavBar = ({ links = [], logoutHandler, showLogout = false }) => {
  const router = useRouter();
  const navigate = (url) => router.push(url, undefined, { scroll: false });

  return (
    <nav
      style={{
        height: "var(--navbar-height)",
        width: "100%",
        backgroundColor: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--space-6)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/home")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          height: "100%",
        }}
        aria-label="Pyro home"
      >
        <img src="/fire.png" width="28" height="28" alt="" style={{ display: "block" }} />
        <PyroWordmark />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", marginLeft: "var(--space-7)" }}>
        <NavLink onClick={() => navigate("/home")} ariaLabel="Home">
          <i className="bi bi-house" style={{ fontSize: 14 }}></i>
          Home
        </NavLink>
        {links.map((link, idx) => (
          <NavLink key={idx} onClick={() => navigate(link.url)}>
            {link.label}
          </NavLink>
        ))}
      </div>

      {showLogout && logoutHandler && (
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <NavLink onClick={logoutHandler} ariaLabel="Logout">
            <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }}></i>
            Logout
          </NavLink>
        </div>
      )}
    </nav>
  );
};
