import React from "react";
import { Button } from "../components/Button";
import { X, Volume2, Sliders, Monitor } from "lucide-react";

export type QualityPreset = "auto" | "low" | "medium" | "high";

export interface SettingsState {
  quality: QualityPreset;
  soundVolume: number;
  musicVolume: number;
  steeringAssist: boolean;
  steeringSensitivity: number;
  showFps: boolean;
}

interface SettingsModalProps {
  settings: SettingsState;
  onChange: (updated: Partial<SettingsState>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 95,
        backgroundColor: "rgba(11, 13, 18, 0.8)",
        backdropFilter: "blur(14px)",
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
          padding: "28px",
          width: "min(440px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Settings
          </h2>

          <Button
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            onClick={onClose}
            aria-label="Close Settings"
          />
        </div>

        {/* Graphics Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
            <Monitor size={15} /> GRAPHICS QUALITY
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {(["auto", "low", "medium", "high"] as QualityPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => onChange({ quality: preset })}
                style={{
                  padding: "10px 4px",
                  borderRadius: "var(--radius-sm)",
                  border: settings.quality === preset ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  backgroundColor: settings.quality === preset ? "var(--accent-primary-alpha)" : "var(--surface-raised)",
                  color: settings.quality === preset ? "var(--accent-primary)" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
            <Volume2 size={15} /> AUDIO LEVELS
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>SFX & Engine</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{settings.soundVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundVolume}
              onChange={(e) => onChange({ soundVolume: Number(e.target.value) })}
              style={{ accentColor: "var(--accent-primary)", width: "100%", height: "6px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>Music</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{settings.musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => onChange({ musicVolume: Number(e.target.value) })}
              style={{ accentColor: "var(--accent-primary)", width: "100%", height: "6px" }}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
            <Sliders size={15} /> CONTROLS & ASSISTS
          </div>

          <label
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-primary)",
            }}
          >
            <span>Steering Assist</span>
            <input
              type="checkbox"
              checked={settings.steeringAssist}
              onChange={(e) => onChange({ steeringAssist: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)" }}
            />
          </label>

          <label
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-primary)",
            }}
          >
            <span>Show FPS Counter</span>
            <input
              type="checkbox"
              checked={settings.showFps}
              onChange={(e) => onChange({ showFps: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)" }}
            />
          </label>
        </div>

        {/* Done Button */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onClose}
          style={{ marginTop: "8px" }}
        >
          Save & Back
        </Button>
      </div>
    </div>
  );
};
