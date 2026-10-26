import React from "react";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Play, Settings, Car, Globe, Download } from "lucide-react";

interface MainMenuScreenProps {
  onRace: () => void;
  onGarage: () => void;
  onSettings: () => void;
  onInstall?: () => void;
  canInstall?: boolean;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onRace,
  onGarage,
  onSettings,
  onInstall,
  canInstall = false,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(16px, 4vw, 32px)",
        pointerEvents: "auto",
        userSelect: "none",
        background:
          "linear-gradient(180deg, rgba(11, 13, 18, 0.7) 0%, rgba(11, 13, 18, 0.3) 50%, rgba(11, 13, 18, 0.85) 100%)",
      }}
    >
      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="md" />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {canInstall && (
            <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={onInstall}>
              Install
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings size={18} />}
            onClick={onSettings}
            aria-label="Settings"
          />
        </div>
      </header>

      {/* Main Menu Center Actions */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          width: "min(360px, 92vw)",
          margin: "auto 0",
        }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Play size={22} fill="#0B0D12" />}
          onClick={onRace}
        >
          Race
        </Button>

        <Button variant="secondary" size="md" fullWidth icon={<Car size={20} />} onClick={onGarage}>
          Garage
        </Button>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          icon={<Settings size={20} />}
          onClick={onSettings}
        >
          Settings
        </Button>

        <div style={{ position: "relative" }}>
          <Button variant="secondary" size="md" fullWidth disabled icon={<Globe size={20} />}>
            Multiplayer
          </Button>
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <Badge label="Soon" variant="rush" size="sm" />
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-ui)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-success)",
            }}
          />
          <span>Offline Ready</span>
        </div>

        <span>v0.4.0</span>
      </footer>
    </div>
  );
};
