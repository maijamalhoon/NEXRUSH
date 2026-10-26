import React from "react";

export interface BadgeProps {
  label: string;
  variant?: "primary" | "rush" | "danger" | "muted" | "success";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "muted",
  size = "md",
}) => {
  const getColors = () => {
    switch (variant) {
      case "primary":
        return {
          bg: "var(--accent-primary-alpha)",
          color: "var(--accent-primary)",
          border: "rgba(212, 255, 42, 0.4)",
        };
      case "rush":
        return {
          bg: "rgba(79, 216, 255, 0.15)",
          color: "var(--accent-rush)",
          border: "rgba(79, 216, 255, 0.4)",
        };
      case "danger":
        return {
          bg: "var(--accent-danger-alpha)",
          color: "var(--accent-danger)",
          border: "rgba(255, 77, 46, 0.4)",
        };
      case "success":
        return {
          bg: "rgba(61, 220, 151, 0.15)",
          color: "var(--accent-success)",
          border: "rgba(61, 220, 151, 0.4)",
        };
      case "muted":
      default:
        return {
          bg: "var(--surface-raised)",
          color: "var(--text-muted)",
          border: "var(--border-subtle)",
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 6px" : "4px 10px",
        borderRadius: "var(--radius-xs)",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        fontSize: size === "sm" ? "10px" : "12px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};
