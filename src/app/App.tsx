import { useState, useEffect, useRef, useCallback } from "react";
import { LocalSession } from "../game/net/LocalSession";
import { InputManager } from "../game/input/InputManager";
import type { RaceSimState } from "../game/sim/types";
import { TRACKS } from "../data/tracks";
import { CARS } from "../data/cars";

import { SplashScreen } from "../ui/screens/SplashScreen";
import { MainMenuScreen } from "../ui/screens/MainMenuScreen";
import { TrackSelectScreen } from "../ui/screens/TrackSelectScreen";
import { CarSelectScreen } from "../ui/screens/CarSelectScreen";
import { RaceHud } from "../ui/screens/RaceHud";
import { PauseModal } from "../ui/screens/PauseModal";
import { SettingsModal, type SettingsState } from "../ui/screens/SettingsModal";
import { ResultsScreen } from "../ui/screens/ResultsScreen";

export type GameScreen = "splash" | "main_menu" | "track_select" | "car_select" | "race" | "results";

export default function App() {
  const [screen, setScreen] = useState<GameScreen>("splash");
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Selections
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS[0].id);
  const [selectedCarId, setSelectedCarId] = useState<string>(CARS[0].id);
  const [selectedColor, setSelectedColor] = useState<string>(CARS[0].colors[0]);

  // Settings
  const [settings, setSettings] = useState<SettingsState>({
    quality: "auto",
    soundVolume: 80,
    musicVolume: 60,
    steeringAssist: true,
    steeringSensitivity: 1.0,
    showFps: false,
  });

  // Game references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<LocalSession | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const [raceState, setRaceState] = useState<RaceSimState | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [fps, setFps] = useState<number>(60);
  const fpsCountRef = useRef({ frames: 0, lastTime: performance.now() });

  // Initialize InputManager
  useEffect(() => {
    const input = new InputManager();
    input.steeringSensitivity = settings.steeringSensitivity;
    input.onPauseRequest = () => {
      setIsPaused((p) => !p);
    };
    input.onResetRequest = () => {
      sessionRef.current?.reset();
    };
    input.attach();
    inputManagerRef.current = input;

    return () => {
      input.detach();
    };
  }, [settings.steeringSensitivity]);

  // Start a new race session
  const startRace = useCallback(async () => {
    const session = new LocalSession({
      trackId: selectedTrackId,
      laps: 3,
      difficulty: "normal",
      playerCarId: selectedCarId,
      playerColor: selectedColor,
      opponentsCount: 3,
    });

    await session.init();
    sessionRef.current = session;
    setRaceState(session.getState());
    setIsPaused(false);
    setScreen("race");
  }, [selectedTrackId, selectedCarId, selectedColor]);

  // Main 60Hz simulation & render loop
  useEffect(() => {
    let lastTime = performance.now();
    let accumulator = 0;
    const fixedDt = 1 / 60;

    const loop = (time: number) => {
      // FPS measurement
      fpsCountRef.current.frames++;
      if (time - fpsCountRef.current.lastTime >= 1000) {
        setFps(Math.round((fpsCountRef.current.frames * 1000) / (time - fpsCountRef.current.lastTime)));
        fpsCountRef.current.frames = 0;
        fpsCountRef.current.lastTime = time;
      }

      const delta = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const session = sessionRef.current;
      const inputManager = inputManagerRef.current;

      if (screen === "race" && session && inputManager && !isPaused) {
        accumulator += delta;
        while (accumulator >= fixedDt) {
          const frame = inputManager.getInputFrame(session.sim.state.tick);
          const nextState = session.step(frame);
          accumulator -= fixedDt;

          if (nextState.phase === "FINISHED") {
            setScreen("results");
            break;
          }
        }
        setRaceState({ ...session.getState() });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [screen, isPaused]);

  // Track next circuit
  const handleNextTrack = () => {
    const currentIdx = TRACKS.findIndex((t) => t.id === selectedTrackId);
    const nextIdx = (currentIdx + 1) % TRACKS.length;
    setSelectedTrackId(TRACKS[nextIdx].id);
    void startRace();
  };

  return (
    <main
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "var(--bg-root)",
      }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="game-viewport" />
      <div className="scene-vignette" />

      {/* FPS Overlay */}
      {settings.showFps && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            zIndex: 110,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "var(--font-display)",
            color: fps >= 55 ? "var(--accent-primary)" : "var(--accent-danger)",
          }}
        >
          {fps} FPS
        </div>
      )}

      {/* Screens Flow */}
      {screen === "splash" && (
        <SplashScreen
          isReady={true}
          onStart={() => setScreen("main_menu")}
        />
      )}

      {screen === "main_menu" && (
        <MainMenuScreen
          onRace={() => setScreen("track_select")}
          onGarage={() => setScreen("car_select")}
          onSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {screen === "track_select" && (
        <TrackSelectScreen
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          onConfirm={() => setScreen("car_select")}
          onBack={() => setScreen("main_menu")}
        />
      )}

      {screen === "car_select" && (
        <CarSelectScreen
          selectedCarId={selectedCarId}
          selectedColor={selectedColor}
          onSelectCar={setSelectedCarId}
          onSelectColor={setSelectedColor}
          onConfirm={() => void startRace()}
          onBack={() => setScreen("track_select")}
        />
      )}

      {screen === "race" && raceState && sessionRef.current && (
        <RaceHud
          raceState={raceState}
          track={sessionRef.current.track}
          onPause={() => setIsPaused(true)}
          onTouchSteer={(s) => inputManagerRef.current?.setTouchSteer(s)}
          onTouchThrottle={(t) => inputManagerRef.current?.setTouchThrottle(t)}
          onTouchBrake={(b) => inputManagerRef.current?.setTouchBrake(b)}
          onTouchHandbrake={(h) => inputManagerRef.current?.setTouchHandbrake(h)}
          onTouchBoost={(bo) => inputManagerRef.current?.setTouchBoost(bo)}
        />
      )}

      {screen === "results" && raceState && (
        <ResultsScreen
          raceState={raceState}
          onAgain={() => void startRace()}
          onMenu={() => setScreen("main_menu")}
          onNextTrack={handleNextTrack}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={() => void startRace()}
          onSettings={() => setIsSettingsOpen(true)}
          onQuit={() => {
            setIsPaused(false);
            setScreen("main_menu");
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </main>
  );
}
