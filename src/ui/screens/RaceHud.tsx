import { useState, useEffect } from "react";
import type { RaceSimState } from "../../game/sim/types";
import type { TrackSpline } from "../../game/sim/track";
import { Minimap } from "../components/Minimap";
import { Pause, Zap } from "lucide-react";

interface RaceHudProps {
  raceState: RaceSimState;
  track: TrackSpline;
  onPause: () => void;
  // Touch event callbacks
  onTouchSteer?: (steer: number) => void;
  onTouchThrottle?: (throttle: number) => void;
  onTouchBrake?: (brake: number) => void;
  onTouchHandbrake?: (handbrake: boolean) => void;
  onTouchBoost?: (boost: boolean) => void;
}

export const RaceHud: React.FC<RaceHudProps> = ({
  raceState,
  track,
  onPause,
  onTouchSteer,
  onTouchThrottle,
  onTouchBrake,
  onTouchHandbrake,
  onTouchBoost,
}) => {
  const player = raceState.cars["player"];
  const allCars = Object.values(raceState.cars);
  const totalCars = allCars.length;

  const playerPosIndex = raceState.standings.indexOf("player");
  const positionNumber = playerPosIndex >= 0 ? playerPosIndex + 1 : 1;

  // Format lap time into MM:SS.ms
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "--:--.--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  // Recent lap banner trigger (shows briefly after crossing start/finish)
  const [showLapToast, setShowLapToast] = useState(false);
  const lastLapTime = player?.lastLapTime ?? 0;

  useEffect(() => {
    if (lastLapTime > 0) {
      setShowLapToast(true);
      const timer = setTimeout(() => setShowLapToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastLapTime]);

  const speedKmh = player?.speedKmh ?? 0;
  const gear = player?.gear ?? 1;
  const currentLap = Math.min(raceState.lapsTotal, player?.lap ?? 1);
  const rushMeter = player?.rushMeter ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        pointerEvents: "none",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px)",
      }}
    >
      {/* Top Bar: Lap, Position, Lap Time, Pause */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        {/* Left: Position & Lap */}
        <div style={{ display: "flex", gap: "12px", pointerEvents: "auto" }}>
          <div
            style={{
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "8px 16px",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
              POS
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "26px",
                fontWeight: 800,
                color: positionNumber === 1 ? "var(--accent-primary)" : "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {positionNumber}
              <small style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "2px" }}>/{totalCars}</small>
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "8px 16px",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
              LAP
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {currentLap}
              <small style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "2px" }}>/{raceState.lapsTotal}</small>
            </span>
          </div>
        </div>

        {/* Center: Lap Timer & Lap Toast */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div
            style={{
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "6px 18px",
              backdropFilter: "blur(8px)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "1px",
              }}
            >
              {formatTime(player?.lapTime ?? 0)}
            </span>
          </div>

          {showLapToast && player && (
            <div
              style={{
                backgroundColor: "var(--surface-raised)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 12px",
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--accent-primary)",
                boxShadow: "0 0 16px rgba(212, 255, 42, 0.3)",
              }}
            >
              LAP {player.lap - 1}: {formatTime(player.lastLapTime)}
            </div>
          )}
        </div>

        {/* Right: Minimap & Pause Button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", pointerEvents: "auto" }}>
          <Minimap track={track} cars={allCars} size={105} />

          <button
            onClick={onPause}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              outline: "none",
            }}
            aria-label="Pause Game"
          >
            <Pause size={20} />
          </button>
        </div>
      </header>

      {/* Countdown Overlay (3.. 2.. 1.. GO!) */}
      {raceState.phase !== "RACING" && raceState.phase !== "FINISHED" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {raceState.phase === "COUNTDOWN" && (
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(80px, 14vw, 130px)",
                fontWeight: 900,
                color: "var(--accent-primary)",
                textShadow: "0 0 30px rgba(212, 255, 42, 0.5)",
                lineHeight: 1,
              }}
            >
              {Math.max(1, Math.ceil(raceState.countdownRemaining))}
            </div>
          )}

          {raceState.phase === "GO" && (
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(80px, 14vw, 130px)",
                fontWeight: 900,
                color: "var(--accent-rush)",
                textShadow: "0 0 40px rgba(79, 216, 255, 0.7)",
                lineHeight: 1,
              }}
            >
              GO!
            </div>
          )}
        </div>
      )}

      {/* Bottom Area: Speedometer, Gear, Rush Meter, and Mobile Touch Controls */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          width: "100%",
        }}
      >
        {/* Left Thumb Touch Zone (Steer) */}
        <div
          className="touch-steer-zone"
          style={{
            pointerEvents: "auto",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onPointerDown={() => onTouchSteer?.(-1)}
            onPointerUp={() => onTouchSteer?.(0)}
            onPointerCancel={() => onTouchSteer?.(0)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Steer Left"
          >
            ◀
          </button>

          <button
            onPointerDown={() => onTouchSteer?.(1)}
            onPointerUp={() => onTouchSteer?.(0)}
            onPointerCancel={() => onTouchSteer?.(0)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Steer Right"
          >
            ▶
          </button>
        </div>

        {/* Center: Big Speedometer & RUSH Meter */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "var(--surface-glass-heavy)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "12px 24px 14px",
            backdropFilter: "blur(12px)",
            minWidth: "180px",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          {/* Speed & Gear */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(46px, 7vw, 68px)",
                fontWeight: 900,
                color: "var(--text-primary)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {speedKmh}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-ui)", fontWeight: 700 }}>
                KM/H
              </span>
              <span style={{ fontSize: "13px", color: "var(--accent-primary)", fontFamily: "var(--font-display)", fontWeight: 800 }}>
                G {gear}
              </span>
            </div>
          </div>

          {/* RUSH Energy Bar */}
          <div style={{ width: "100%", marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--accent-rush)", fontWeight: 700, marginBottom: "3px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <Zap size={11} fill="var(--accent-rush)" /> RUSH
              </span>
              <span>{Math.round(rushMeter)}%</span>
            </div>
            <div
              style={{
                height: "6px",
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "var(--radius-pill)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${rushMeter}%`,
                  backgroundColor: "var(--accent-rush)",
                  boxShadow: rushMeter > 20 ? "0 0 10px var(--accent-rush)" : "none",
                  transition: "width 100ms linear",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Thumb Touch Zone (Gas, Brake, Handbrake, Boost) */}
        <div
          className="touch-pedals-zone"
          style={{
            pointerEvents: "auto",
            display: "grid",
            gridTemplateColumns: "52px 52px",
            gap: "10px",
          }}
        >
          {/* Boost / Rush Button */}
          <button
            onPointerDown={() => onTouchBoost?.(true)}
            onPointerUp={() => onTouchBoost?.(false)}
            onPointerCancel={() => onTouchBoost?.(false)}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-md)",
              backgroundColor: rushMeter > 10 ? "var(--accent-rush)" : "var(--surface-glass)",
              color: rushMeter > 10 ? "#0B0D12" : "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-display)",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Rush Boost"
          >
            RUSH
          </button>

          {/* Handbrake / Drift Button */}
          <button
            onPointerDown={() => onTouchHandbrake?.(true)}
            onPointerUp={() => onTouchHandbrake?.(false)}
            onPointerCancel={() => onTouchHandbrake?.(false)}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-glass)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Handbrake"
          >
            DRIFT
          </button>

          {/* Brake / Reverse Button */}
          <button
            onPointerDown={() => onTouchBrake?.(1)}
            onPointerUp={() => onTouchBrake?.(0)}
            onPointerCancel={() => onTouchBrake?.(0)}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-danger)",
              color: "#FFFFFF",
              border: "1px solid var(--accent-danger)",
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Brake"
          >
            ▼
          </button>

          {/* Throttle / Accelerate Button */}
          <button
            onPointerDown={() => onTouchThrottle?.(1)}
            onPointerUp={() => onTouchThrottle?.(0)}
            onPointerCancel={() => onTouchThrottle?.(0)}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-primary)",
              color: "#0B0D12",
              border: "1px solid var(--accent-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              touchAction: "none",
            }}
            aria-label="Accelerate"
          >
            ▲
          </button>
        </div>
      </footer>
    </div>
  );
};
