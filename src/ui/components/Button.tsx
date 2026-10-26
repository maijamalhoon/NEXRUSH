import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  fullWidth = false,
  icon,
  className = "",
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: "var(--accent-primary)",
          color: "#0B0D12",
          border: "1px solid var(--accent-primary)",
          fontWeight: 700,
        };
      case "danger":
        return {
          background: "var(--accent-danger)",
          color: "#FFFFFF",
          border: "1px solid var(--accent-danger)",
          fontWeight: 700,
        };
      case "ghost":
        return {
          background: "transparent",
          color: "var(--text-muted)",
          border: "1px solid transparent",
          fontWeight: 600,
        };
      case "secondary":
      default:
        return {
          background: "var(--surface-raised)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          fontWeight: 600,
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case "sm":
        return {
          padding: "8px 14px",
          minHeight: "36px",
          fontSize: "13px",
        };
      case "lg":
        return {
          padding: "14px 28px",
          minHeight: "56px",
          fontSize: "18px",
        };
      case "md":
      default:
        return {
          padding: "12px 22px",
          minHeight: "48px", // Respects touch budget
          fontSize: "15px",
        };
    }
  };

  return (
    <button
      className={`nr-btn nr-btn-${variant} ${className}`}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all var(--anim-fast)",
        outline: "none",
        width: fullWidth ? "100%" : "auto",
        userSelect: "none",
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </button>
  );
};
