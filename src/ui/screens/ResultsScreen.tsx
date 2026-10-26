import React from "react";
import type { RaceSimState } from "../../game/sim/types";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { RotateCcw, Home, FastForward, Trophy } from "lucide-react";

interface ResultsScreenProps {
  raceState: RaceSimState;
  onAgain: () => void;
  onMenu: () => void;
  onNextTrack: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  raceState,
  onAgain,
  onMenu,
  onNextTrack,
}) => {
  const playerPosIndex = raceState.standings.indexOf("player");
  const playerPos = playerPosIndex >= 0 ? playerPosIndex + 1 : 1;
  const isWinner = playerPos === 1;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "--:--.--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        backgroundColor: "rgba(11, 13, 18, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(20px, 4vw, 40px)",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginTop: "12px" }}>
        <div
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
        >
          <Trophy size={28} color={isWinner ? "var(--accent-primary)" : "var(--accent-rush)"} />
          <Badge
            label={isWinner ? "VICTORY" : `FINISHED P${playerPos}`}
            variant={isWinner ? "primary" : "rush"}
            size="md"
          />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}
        >
          Race Results
        </h1>
      </header>

      {/* Standings Table */}
      <main
        style={{
          width: "min(520px, 92vw)",
          margin: "0 auto",
          backgroundColor: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 90px",
            fontSize: "11px",
            color: "var(--text-muted)",
            fontWeight: 700,
            paddingBottom: "8px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span>POS</span>
          <span>DRIVER</span>
          <span style={{ textAlign: "right" }}>BEST LAP</span>
        </div>

        {raceState.standings.map((carId, index) => {
          const car = raceState.cars[carId];
          if (!car) return null;
          const pos = index + 1;
          const isPlayerRow = car.isPlayer;

          return (
            <div
              key={carId}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 90px",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: isPlayerRow ? "var(--accent-primary-alpha)" : "transparent",
                border: isPlayerRow ? "1px solid rgba(212, 255, 42, 0.3)" : "1px solid transparent",
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: isPlayerRow ? 800 : 600,
                color: isPlayerRow ? "var(--accent-primary)" : "var(--text-primary)",
              }}
            >
              <span>{pos}</span>
              <span>{car.name}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(car.bestLapTime)}
              </span>
            </div>
          );
        })}
      </main>

      {/* Action Buttons */}
      <footer
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <Button variant="secondary" size="md" icon={<Home size={18} />} onClick={onMenu}>
          Menu
        </Button>

        <Button variant="secondary" size="md" icon={<RotateCcw size={18} />} onClick={onAgain}>
          Again
        </Button>

        <Button
          variant="primary"
          size="md"
          icon={<FastForward size={18} fill="#0B0D12" />}
          onClick={onNextTrack}
        >
          Next Track
        </Button>
      </footer>
    </div>
  );
};
