import React from "react";
import { TRACKS } from "../../data/tracks";
import type { TrackData } from "../../game/sim/types";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { ChevronLeft, ChevronRight, ArrowLeft, Check } from "lucide-react";

interface TrackSelectScreenProps {
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const TrackSelectScreen: React.FC<TrackSelectScreenProps> = ({
  selectedTrackId,
  onSelectTrack,
  onConfirm,
  onBack,
}) => {
  const currentIndex = TRACKS.findIndex((t) => t.id === selectedTrackId);
  const currentTrack: TrackData = TRACKS[currentIndex] || TRACKS[0];

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    onSelectTrack(TRACKS[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % TRACKS.length;
    onSelectTrack(TRACKS[nextIdx].id);
  };

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
        background: "linear-gradient(180deg, rgba(11, 13, 18, 0.8) 0%, rgba(11, 13, 18, 0.4) 50%, rgba(11, 13, 18, 0.9) 100%)",
      }}
    >
      {/* Top bar */}
      <header style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={18} />}
          onClick={onBack}
          aria-label="Back to Menu"
        >
          Back
        </Button>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Select Circuit
        </span>
      </header>

      {/* Center Carousel */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        <Button
          variant="secondary"
          size="md"
          icon={<ChevronLeft size={24} />}
          onClick={handlePrev}
          aria-label="Previous Track"
        />

        <div
          style={{
            backgroundColor: "var(--surface-glass)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            textAlign: "center",
            width: "min(400px, 75vw)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Badge
              label={currentTrack.difficulty}
              variant={
                currentTrack.difficulty === "Easy"
                  ? "success"
                  : currentTrack.difficulty === "Hard"
                  ? "danger"
                  : "primary"
              }
            />
            <Badge label={`${currentTrack.lengthMeters} M`} variant="muted" />
          </div>

          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 4vw, 32px)",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: "4px 0",
                letterSpacing: "1px",
              }}
            >
              {currentTrack.name}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              {currentTrack.subtitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            <div>Laps: <b style={{ color: "var(--text-primary)" }}>{currentTrack.defaultLaps}</b></div>
            <div>Width: <b style={{ color: "var(--text-primary)" }}>{currentTrack.roadWidth}m</b></div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<ChevronRight size={24} />}
          onClick={handleNext}
          aria-label="Next Track"
        />
      </main>

      {/* Bottom Confirm */}
      <footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary"
          size="lg"
          icon={<Check size={20} />}
          onClick={onConfirm}
        >
          Choose Car
        </Button>
      </footer>
    </div>
  );
};
