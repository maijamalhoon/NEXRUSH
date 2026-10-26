import React from "react";
import { Button } from "../components/Button";
import { Play, RotateCcw, Settings, Home } from "lucide-react";

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSettings,
  onQuit,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(11, 13, 18, 0.75)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
          width: "min(340px, 90vw)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "var(--shadow-elevated)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 10px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
          }}
        >
          Paused
        </h2>

        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<Play size={18} fill="#0B0D12" />}
          onClick={onResume}
        >
          Resume
        </Button>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          icon={<RotateCcw size={18} />}
          onClick={onRestart}
        >
          Restart
        </Button>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          icon={<Settings size={18} />}
          onClick={onSettings}
        >
          Settings
        </Button>

        <Button variant="ghost" size="md" fullWidth icon={<Home size={18} />} onClick={onQuit}>
          Main Menu
        </Button>
      </div>
    </div>
  );
};
