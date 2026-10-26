import { useState, useEffect, useRef, useCallback } from "react";
import { LocalSession } from "../game/net/LocalSession";
import { InputManager } from "../game/input/InputManager";
import { SceneManager } from "../game/render/SceneManager";
import { AudioController } from "../game/audio/AudioController";
import { TrackSpline } from "../game/sim/track";
import type { RaceSimState } from "../game/sim/types";
import { TRACKS, getTrackById } from "../data/tracks";
import { CARS } from "../data/cars";
import { StorageManager } from "../storage/storage";

import { SplashScreen } from "../ui/screens/SplashScreen";
import { MainMenuScreen } from "../ui/screens/MainMenuScreen";
import { TrackSelectScreen } from "../ui/screens/TrackSelectScreen";
import { CarSelectScreen } from "../ui/screens/CarSelectScreen";
import { RaceHud } from "../ui/screens/RaceHud";
import { PauseModal } from "../ui/screens/PauseModal";
import { SettingsModal, type SettingsState } from "../ui/screens/SettingsModal";
import { ResultsScreen } from "../ui/screens/ResultsScreen";

export type GameScreen =
  "splash" | "main_menu" | "track_select" | "car_select" | "race" | "results";

// Custom BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>("splash");
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Selections
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS[0].id);
  const [selectedCarId, setSelectedCarId] = useState<string>(CARS[0].id);
  const [selectedColor, setSelectedColor] = useState<string>(CARS[0].colors[0]);

  // Settings from Storage
  const [settings, setSettings] = useState<SettingsState>(() => StorageManager.load().settings);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Game references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<LocalSession | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const audioControllerRef = useRef<AudioController>(new AudioController());
  const inputManagerRef = useRef<InputManager | null>(null);
  const [raceState, setRaceState] = useState<RaceSimState | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [fps, setFps] = useState<number>(60);
  const fpsCountRef = useRef({ frames: 0, lastTime: performance.now() });
  const prevCountdownRef = useRef<number>(4);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Initialize PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Screen Wake Lock API
  useEffect(() => {
    const requestWakeLock = async () => {
      if (screen === "race" && "wakeLock" in navigator && !wakeLockRef.current) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        } catch {
          // Ignored
        }
      } else if (screen !== "race" && wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    void requestWakeLock();
  }, [screen]);

  // Initialize Babylon SceneManager
  useEffect(() => {
    if (!canvasRef.current) return;
    const sceneMgr = new SceneManager(canvasRef.current);
    sceneMgr.setQuality(settings.quality);

    // Initial background showcase circuit
    const trackData = getTrackById(selectedTrackId);
    const initialTrack = new TrackSpline(trackData);
    sceneMgr.loadTrack(initialTrack);
    sceneMgr.setCameraMode("ORBIT");

    sceneManagerRef.current = sceneMgr;

    return () => {
      sceneMgr.dispose();
      sceneManagerRef.current = null;
      audioControllerRef.current.dispose();
    };
  }, []);

  // Update quality preset & audio volumes on change
  useEffect(() => {
    sceneManagerRef.current?.setQuality(settings.quality);
    audioControllerRef.current.setVolumes(settings.soundVolume, settings.musicVolume);

    // Persist settings
    const currentStorage = StorageManager.load();
    StorageManager.save({ ...currentStorage, settings });
  }, [settings]);

  // Update camera mode depending on active screen
  useEffect(() => {
    if (screen === "race") {
      const playerCar = sessionRef.current?.getState().cars["player"];
      sceneManagerRef.current?.setCameraMode("CHASE", playerCar?.heading);
    } else {
      sceneManagerRef.current?.setCameraMode("ORBIT");
    }
  }, [screen]);

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
    audioControllerRef.current.unlock();
    audioControllerRef.current.playClick();

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
    prevCountdownRef.current = 4;

    // Update 3D scene track
    if (sceneManagerRef.current) {
      sceneManagerRef.current.loadTrack(session.track);
      const playerSlot = session.track.getGridSlot(0);
      sceneManagerRef.current.setCameraMode("CHASE", playerSlot.heading);
    }

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
        setFps(
          Math.round((fpsCountRef.current.frames * 1000) / (time - fpsCountRef.current.lastTime))
        );
        fpsCountRef.current.frames = 0;
        fpsCountRef.current.lastTime = time;
      }

      const delta = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const session = sessionRef.current;
      const inputManager = inputManagerRef.current;
      const sceneMgr = sceneManagerRef.current;
      const audio = audioControllerRef.current;

      let currentPlayerCar = null;

      if (screen === "race" && session && inputManager && !isPaused) {
        accumulator += delta;
        while (accumulator >= fixedDt) {
          const frame = inputManager.getInputFrame(session.sim.state.tick);
          const nextState = session.step(frame);
          accumulator -= fixedDt;

          // Countdown beeps
          if (nextState.phase === "COUNTDOWN") {
            const countNum = Math.ceil(nextState.countdownRemaining);
            if (countNum !== prevCountdownRef.current) {
              prevCountdownRef.current = countNum;
              audio.playCountdownBeep(false);
            }
          } else if (nextState.phase === "GO" && prevCountdownRef.current !== 0) {
            prevCountdownRef.current = 0;
            audio.playCountdownBeep(true);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([60, 40, 60]);
            }
          }

          if (nextState.phase === "FINISHED") {
            const pCar = nextState.cars["player"];
            const isWinner = nextState.standings[0] === "player";
            StorageManager.recordRace(
              selectedTrackId,
              selectedCarId,
              pCar?.bestLapTime ?? 0,
              isWinner
            );
            setScreen("results");
            break;
          }
        }

        const currentState = session.getState();
        setRaceState({ ...currentState });
        currentPlayerCar = currentState.cars["player"] ?? null;

        // Audio updates
        if (currentPlayerCar) {
          audio.updateTelemetry(
            currentPlayerCar.rpm,
            currentPlayerCar.driftAngle,
            currentPlayerCar.isBoosting,
            false
          );
        }
      }

      // 3D Babylon render frame
      if (sceneMgr) {
        sceneMgr.renderFrame(session?.getState() ?? null, currentPlayerCar, delta);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [screen, isPaused, selectedTrackId, selectedCarId]);

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
          onStart={() => {
            audioControllerRef.current.unlock();
            audioControllerRef.current.playClick();
            setScreen("main_menu");
          }}
        />
      )}

      {screen === "main_menu" && (
        <MainMenuScreen
          onRace={() => {
            audioControllerRef.current.playClick();
            setScreen("track_select");
          }}
          onGarage={() => {
            audioControllerRef.current.playClick();
            setScreen("car_select");
          }}
          onSettings={() => {
            audioControllerRef.current.playClick();
            setIsSettingsOpen(true);
          }}
          onInstall={handleInstallApp}
          canInstall={Boolean(deferredPrompt)}
        />
      )}

      {screen === "track_select" && (
        <TrackSelectScreen
          selectedTrackId={selectedTrackId}
          onSelectTrack={(tId) => {
            audioControllerRef.current.playClick();
            setSelectedTrackId(tId);
            const trackData = getTrackById(tId);
            sceneManagerRef.current?.loadTrack(new TrackSpline(trackData));
          }}
          onConfirm={() => {
            audioControllerRef.current.playClick();
            setScreen("car_select");
          }}
          onBack={() => {
            audioControllerRef.current.playClick();
            setScreen("main_menu");
          }}
        />
      )}

      {screen === "car_select" && (
        <CarSelectScreen
          selectedCarId={selectedCarId}
          selectedColor={selectedColor}
          onSelectCar={(cId) => {
            audioControllerRef.current.playClick();
            setSelectedCarId(cId);
          }}
          onSelectColor={(col) => {
            audioControllerRef.current.playClick();
            setSelectedColor(col);
          }}
          onConfirm={() => void startRace()}
          onBack={() => {
            audioControllerRef.current.playClick();
            setScreen("track_select");
          }}
        />
      )}

      {screen === "race" && raceState && sessionRef.current && (
        <RaceHud
          raceState={raceState}
          track={sessionRef.current.track}
          onPause={() => {
            audioControllerRef.current.playClick();
            setIsPaused(true);
          }}
          onTouchSteer={(s) => inputManagerRef.current?.setTouchSteer(s)}
          onTouchThrottle={(t) => inputManagerRef.current?.setTouchThrottle(t)}
          onTouchBrake={(b) => inputManagerRef.current?.setTouchBrake(b)}
          onTouchHandbrake={(h) => {
            if (h && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);
            inputManagerRef.current?.setTouchHandbrake(h);
          }}
          onTouchBoost={(bo) => {
            if (bo && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(35);
            inputManagerRef.current?.setTouchBoost(bo);
          }}
        />
      )}

      {screen === "results" && raceState && (
        <ResultsScreen
          raceState={raceState}
          onAgain={() => void startRace()}
          onMenu={() => {
            audioControllerRef.current.playClick();
            setScreen("main_menu");
          }}
          onNextTrack={handleNextTrack}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => {
            audioControllerRef.current.playClick();
            setIsPaused(false);
          }}
          onRestart={() => void startRace()}
          onSettings={() => {
            audioControllerRef.current.playClick();
            setIsSettingsOpen(true);
          }}
          onQuit={() => {
            audioControllerRef.current.playClick();
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
          onClose={() => {
            audioControllerRef.current.playClick();
            setIsSettingsOpen(false);
          }}
        />
      )}
    </main>
  );
}
