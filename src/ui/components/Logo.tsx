import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", showWordmark = true, className = "" }) => {
  const iconSizes = {
    sm: 28,
    md: 40,
    lg: 56,
  };

  const px = iconSizes[size];

  return (
    <div
      className={`logo-container flex items-center gap-3 ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px", userSelect: "none" }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="NEXRUSH logo"
      >
        {/* Background shield badge */}
        <path
          d="M6 10L24 3L42 10V26C42 36 24 45 24 45C24 45 6 36 6 26V10Z"
          fill="#12151C"
          stroke="#262C3A"
          strokeWidth="2"
        />
        {/* Aerodynamic Forward Chevrons / Stylized N in Volt Lime */}
        <path d="M14 34L22 14H27L19 34H14Z" fill="#D4FF2A" />
        <path d="M23 34L31 14H36L28 34H23Z" fill="#D4FF2A" opacity="0.85" />
        <path d="M18 25L32 17V21L18 29V25Z" fill="#4FD8FF" opacity="0.9" />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            letterSpacing: "1.5px",
            fontSize: size === "sm" ? "18px" : size === "md" ? "24px" : "34px",
            lineHeight: 1,
            color: "var(--text-primary)",
          }}
        >
          NEX<span style={{ color: "var(--accent-primary)" }}>RUSH</span>
        </span>
      )}
    </div>
  );
};
