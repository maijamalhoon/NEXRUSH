import React from "react";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Play } from "lucide-react";

interface SplashScreenProps {
  onStart: () => void;
  loadingProgress?: number;
  isReady: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStart,
  loadingProgress = 100,
  isReady,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        backgroundColor: "var(--bg-root)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <Logo size="lg" />

        <div style={{ width: "100%", marginTop: "12px" }}>
          {!isReady ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  height: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-pill)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${loadingProgress}%`,
                    backgroundColor: "var(--accent-primary)",
                    transition: "width 200ms ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Loading Assets...
              </span>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<Play size={20} fill="#0B0D12" />}
              onClick={onStart}
            >
              Start Engine
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
