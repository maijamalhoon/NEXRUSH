import React from "react";
import { CARS } from "../../data/cars";
import type { CarSpec } from "../../game/sim/types";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { StatBar } from "../components/StatBar";
import { ChevronLeft, ChevronRight, ArrowLeft, Play } from "lucide-react";

interface CarSelectScreenProps {
  selectedCarId: string;
  selectedColor?: string;
  onSelectCar: (carId: string) => void;
  onSelectColor: (color: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const CarSelectScreen: React.FC<CarSelectScreenProps> = ({
  selectedCarId,
  selectedColor,
  onSelectCar,
  onSelectColor,
  onConfirm,
  onBack,
}) => {
  const currentIndex = CARS.findIndex((c) => c.id === selectedCarId);
  const currentCar: CarSpec = CARS[currentIndex] || CARS[0];
  const activeColor = selectedColor || currentCar.colors[0];

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + CARS.length) % CARS.length;
    const car = CARS[prevIdx];
    onSelectCar(car.id);
    onSelectColor(car.colors[0]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % CARS.length;
    const car = CARS[nextIdx];
    onSelectCar(car.id);
    onSelectColor(car.colors[0]);
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
        background:
          "linear-gradient(180deg, rgba(11, 13, 18, 0.7) 0%, rgba(11, 13, 18, 0.2) 50%, rgba(11, 13, 18, 0.9) 100%)",
      }}
    >
      {/* Top Header */}
      <header style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={18} />}
          onClick={onBack}
          aria-label="Back"
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
          Garage
        </span>
      </header>

      {/* Main Stats Card & Nav */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <Button
          variant="secondary"
          size="md"
          icon={<ChevronLeft size={24} />}
          onClick={handlePrev}
          aria-label="Previous Car"
        />

        <div
          style={{
            backgroundColor: "var(--surface-glass)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 30px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            width: "min(380px, 80vw)",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Car Header */}
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                <Badge label={currentCar.class} variant="primary" size="sm" />
                <Badge label={currentCar.driveType} variant="muted" size="sm" />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(22px, 3.5vw, 28px)",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "0.8px",
                }}
              >
                {currentCar.name}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                }}
              >
                {currentCar.topSpeedKmh}
              </div>
              <div
                style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}
              >
                KM/H MAX
              </div>
            </div>
          </div>

          {/* Stat Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <StatBar
              label="Top Speed"
              value={currentCar.stats.topSpeed}
              color="var(--accent-primary)"
            />
            <StatBar
              label="Acceleration"
              value={currentCar.stats.accel}
              color="var(--accent-primary)"
            />
            <StatBar
              label="Handling"
              value={currentCar.stats.handling}
              color="var(--accent-primary)"
            />
            <StatBar
              label="Rush Rate"
              value={currentCar.stats.rushRate}
              color="var(--accent-rush)"
            />
          </div>

          {/* Color Picker Swatches */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Paint Finish
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              {currentCar.colors.map((colorHex) => (
                <button
                  key={colorHex}
                  onClick={() => onSelectColor(colorHex)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: colorHex,
                    border:
                      activeColor === colorHex
                        ? "2px solid #FFFFFF"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    outline: activeColor === colorHex ? "2px solid var(--accent-primary)" : "none",
                    outlineOffset: "2px",
                    cursor: "pointer",
                    transition: "transform 150ms ease",
                    transform: activeColor === colorHex ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={`Select color ${colorHex}`}
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={<ChevronRight size={24} />}
          onClick={handleNext}
          aria-label="Next Car"
        />
      </main>

      {/* Start Race Trigger */}
      <footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary"
          size="lg"
          icon={<Play size={20} fill="#0B0D12" />}
          onClick={onConfirm}
        >
          Launch Race
        </Button>
      </footer>
    </div>
  );
};
