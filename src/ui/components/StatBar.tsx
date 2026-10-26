import React from "react";

export interface StatBarProps {
  label: string;
  value: number; // 0 to 100
  color?: string;
  showValue?: boolean;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  color = "var(--accent-primary)",
  showValue = true,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        {showValue && (
          <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700 }}>
            {clamped}
          </span>
        )}
      </div>

      <div
        style={{
          height: "6px",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderRadius: "var(--radius-xs)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: "var(--radius-xs)",
            transition: "width 300ms var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
};
