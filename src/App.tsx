import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { RacingScene, QualityMode, Telemetry, RaceEvent } from "./game/RacingScene";
import { CARS, SKINS, TRACKS, UPGRADES, type Difficulty, type RaceSetup, type UpgradeId } from "./game/catalog";

type Screen = "home" | "tracks" | "garage" | "upgrades" | "race" | "results";
type Levels = Record<UpgradeId, number>;
type SaveData = {
  coins: number;
  ownedCars: string[];
  unlockedSkins: string[];
  paintByCar: Record<string, string>;
  upgrades: Record<string, Partial<Levels>>;
  bestTimes: Record<string, number>;
  totalTakedowns: number;
};
const freshSave: SaveData = { coins: 350, ownedCars: ["vortex"], unlockedSkins: ["SIGNAL RED"], paintByCar: {}, upgrades: {}, bestTimes: {}, totalTakedowns: 0 };
const defaultLevels: Levels = { engine: 0, handling: 0, nitro: 0, armor: 0 };
const empty: Telemetry = { speed: 0, rpm: 900, gear: 1, elapsed: 0, lap: 1, position: 4, offTrack: false, driftAngle: 0, lapTime: 0, lastLapTime: 0, bestLapTime: 0, countdown: 3, racePhase: "COUNTDOWN", nitro: 100, takedowns: 0 };
function readSave(): SaveData {
  try {
    const raw = localStorage.getItem("nexrush-save-v1");
    if (!raw) return freshSave;
    const value = JSON.parse(raw) as Partial<SaveData>;
    return { ...freshSave, ...value, ownedCars: Array.isArray(value.ownedCars) ? value.ownedCars : freshSave.ownedCars, unlockedSkins: Array.isArray(value.unlockedSkins) ? value.unlockedSkins : freshSave.unlockedSkins, paintByCar: value.paintByCar ?? {}, upgrades: value.upgrades ?? {}, bestTimes: value.bestTimes ?? {}, totalTakedowns: value.totalTakedowns ?? 0 };
  } catch { return freshSave; }
}
const time = (s: number) => String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0") + ":" + String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0") + "." + String(Math.floor(Math.max(0, s) % 1 * 100)).padStart(2, "0");
function CarArt({ color, accent, large = false }: { color: string; accent: string; large?: boolean }) {
  return <svg className={large ? "car-art car-art-large" : "car-art"} viewBox="0 0 400 170" aria-hidden="true">
    <defs><linearGradient id={"paint-" + color.replace("#", "")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={accent}/><stop offset=".35" stopColor={color}/><stop offset="1" stopColor={color}/></linearGradient></defs>
    <ellipse cx="202" cy="138" rx="150" ry="14" fill="#000" opacity=".36"/>
    <path d="M42 112 L57 93 Q69 88 108 84 L144 48 Q157 35 193 35 L248 37 Q266 39 289 65 L333 80 Q350 83 359 101 L361 120 L334 128 L63 128 L42 120 Z" fill={"url(#paint-" + color.replace("#", "") + ")"} stroke={accent} strokeWidth="2.2"/>
    <path d="M123 82 L151 51 Q160 44 188 44 L217 46 L233 80 Z" fill="#071321" stroke={accent} strokeWidth="1.8"/>
    <path d="M241 47 Q258 50 279 77 L246 80 L225 46 Z" fill="#0d2033" stroke={accent} strokeWidth="1.5"/>
    <path d="M46 111 L86 108 L94 117 L49 119 Z" fill={accent}/><path d="M318 91 L348 100 L352 108 L324 106 Z" fill="#ff4c70"/>
    <path d="M111 89 L288 87 L308 96 L95 101 Z" fill="#e9f6ff" opacity=".13"/>
    <circle cx="109" cy="121" r="25" fill="#03070d" stroke="#536777" strokeWidth="4"/><circle cx="109" cy="121" r="12" fill="#1a2a39" stroke={accent} strokeWidth="3"/><circle cx="309" cy="121" r="25" fill="#03070d" stroke="#536777" strokeWidth="4"/><circle cx="309" cy="121" r="12" fill="#1a2a39" stroke={accent} strokeWidth="3"/>
    <path d="M73 131 L347 131" stroke={accent} strokeWidth="2" opacity=".8"/>
  </svg>;
}
function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<RacingScene | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [quality, setQuality] = useState<QualityMode>("auto");
  const qualityRef = useRef<QualityMode>("auto");
  const [raceData, setRaceData] = useState<Telemetry>(empty);
  const [save, setSave] = useState<SaveData>(readSave);
  const [trackId, setTrackId] = useState("neon-city");
  const [carId, setCarId] = useState("vortex");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [help, setHelp] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const [toast, setToast] = useState("");
  const [result, setResult] = useState<{ position: number; elapsed: number; reward: number } | null>(null);

  const track = TRACKS.find((item) => item.id === trackId) ?? TRACKS[0];
  const car = CARS.find((item) => item.id === carId) ?? CARS[0];
  const owned = save.ownedCars.includes(car.id);
  const paint = save.paintByCar[car.id] ?? car.color;
  const levels = { ...defaultLevels, ...(save.upgrades[car.id] ?? {}) };
  const control = useCallback((key: string, down: boolean) => game.current?.setControl(key, down), []);

  useEffect(() => { try { localStorage.setItem("nexrush-save-v1", JSON.stringify(save)); } catch { /* storage can be disabled */ } }, [save]);
  useEffect(() => { qualityRef.current = quality; game.current?.setQuality(quality); }, [quality]);

  const onRaceEvent = useCallback((event: RaceEvent) => {
    if (event.type === "TAKEDOWN") {
      setSave((prev) => ({ ...prev, coins: prev.coins + event.reward, totalTakedowns: prev.totalTakedowns + 1 }));
      setToast("TAKEDOWN  +" + event.reward + " CR");
      return;
    }
    setResult({ position: event.position, elapsed: event.elapsed, reward: event.reward });
    setSave((prev) => {
      const previous = prev.bestTimes[trackId];
      return { ...prev, coins: prev.coins + event.reward, bestTimes: { ...prev.bestTimes, [trackId]: !previous || event.elapsed < previous ? event.elapsed : previous } };
    });
    setScreen("results");
  }, [trackId]);

  useEffect(() => {
    const targetCanvas = canvas.current;
    if (screen !== "race" || !targetCanvas || !owned) return;
    let instance: RacingScene | null = null;
    let cancelled = false;
    const fail = (error: unknown) => {
      console.error("NEXRUSH could not initialize WebGL.", error);
      if (!cancelled) { setEngineError(true); setScreen("home"); }
    };
    const setup: RaceSetup = { track, car, difficulty, paint, upgrades: levels };
    void import("./game/RacingScene").then(({ RacingScene }) => {
      if (cancelled) return;
      try {
        const created = new RacingScene(targetCanvas, setRaceData, setup, onRaceEvent);
        created.setQuality(qualityRef.current);
        instance = created; game.current = created;
        void created.start().then(() => { if (!cancelled) setEngineError(false); }).catch(fail);
      } catch (error) { fail(error); }
    }).catch(fail);
    return () => {
      cancelled = true;
      if (instance) instance.dispose();
      if (game.current === instance) game.current = null;
    };
  }, [screen, track, car, difficulty, paint, levels.engine, levels.handling, levels.nitro, levels.armor, owned, onRaceEvent]);

  const buyCar = () => {
    if (owned) return;
    if (save.coins < car.price) { setToast("NOT ENOUGH CREDITS"); return; }
    setSave((prev) => ({ ...prev, coins: prev.coins - car.price, ownedCars: [...prev.ownedCars, car.id] }));
    setToast(car.name + " UNLOCKED");
  };
  const buySkin = (skin: typeof SKINS[number]) => {
    const unlocked = save.unlockedSkins.includes(skin.id) || save.unlockedSkins.includes(skin.name);
    if (!unlocked && save.coins < skin.price) { setToast("NOT ENOUGH CREDITS"); return; }
    setSave((prev) => ({
      ...prev,
      coins: unlocked ? prev.coins : prev.coins - skin.price,
      unlockedSkins: unlocked ? prev.unlockedSkins : [...prev.unlockedSkins, skin.id, skin.name],
      paintByCar: { ...prev.paintByCar, [car.id]: skin.color }
    }));
    setToast(skin.name + " EQUIPPED");
  };
  const buyUpgrade = (upgrade: typeof UPGRADES[number]) => {
    const level = levels[upgrade.id];
    if (level >= 5) return;
    const price = upgrade.basePrice * (level + 1);
    if (save.coins < price) { setToast("NOT ENOUGH CREDITS"); return; }
    setSave((prev) => ({
      ...prev, coins: prev.coins - price,
      upgrades: { ...prev.upgrades, [car.id]: { ...defaultLevels, ...(prev.upgrades[car.id] ?? {}), [upgrade.id]: level + 1 } }
    }));
    setToast(upgrade.name + " UPGRADED");
  };
  const startRace = () => {
    if (!owned) { setScreen("garage"); setToast("UNLOCK A CAR FIRST"); return; }
    setResult(null); setRaceData(empty); setToast(""); setEngineError(false); setScreen("race");
  };
  const goTracks = () => setScreen("tracks");
  const goGarage = () => setScreen("garage");
  const back = () => setScreen("home");
  const score = Math.round(car.topSpeed / 2.8 + car.acceleration * 1.3 + car.handling * 30 + car.durability / 5 + levels.engine * 2 + levels.handling * 2);
  const best = save.bestTimes[track.id];
  const menuButton = (label: string, target: Screen) => <button className={"nav-link" + (screen === target ? " active" : "")} onClick={() => setScreen(target)}>{label}</button>;

  return <main className={"app" + (screen === "race" ? " app-racing" : "")}>
    <header className="topbar">
      <button className="brand" onClick={back} aria-label="NEXRUSH home"><span className="brand-mark">N</span><span className="brand-word">NEX<span>RUSH</span><small>RACING DIVISION</small></span></button>
      {screen !== "race" && <nav className="main-nav">{menuButton("OVERVIEW", "home")}{menuButton("RACE", "tracks")}{menuButton("GARAGE", "garage")}{menuButton("UPGRADES", "upgrades")}</nav>}
      <div className="wallet"><span className="coin-icon">◆</span><span>{save.coins.toLocaleString()}</span><small>CR</small></div>
    </header>

    {screen === "home" && <section className="home-screen">
      <div className="hero-scanlines"/><div className="hero-kicker"><span className="live-dot"/> NEXT-GEN BROWSER RACING <b>SEASON 01</b></div>
      <div className="hero-copy"><p className="overline">THERE ARE NO SAFE LINES.</p><h1>OWN THE<br/><em>APEX.</em></h1><p className="hero-desc">Three worlds. Five machines. One name at the top.</p>
        <div className="hero-actions"><button className="btn btn-primary" onClick={goTracks}>ENTER THE GRID <span>↗</span></button><button className="btn btn-ghost" onClick={goGarage}>OPEN GARAGE</button></div>
        <div className="hero-meta"><span><b>03</b> TRACKS</span><span><b>05</b> MACHINES</span><span><b>{save.totalTakedowns}</b> TAKEDOWNS</span></div>
      </div>
      <div className="hero-visual"><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><div className="hero-label label-top"><span>01 / 03</span><b>{track.name}</b></div><CarArt color={paint} accent={car.accent} large/><div className="hero-label label-bottom"><span>YOUR CURRENT RIDE</span><b>{car.name} <i>·</i> {car.model}</b></div><div className="hero-stats"><span>TOP SPEED<strong>{car.topSpeed + levels.engine * 6}</strong></span><span>PERFORMANCE<strong>{score}</strong></span></div></div>
      <div className="home-bottom"><span>01 — RACE. EARN. EVOLVE.</span><span>ADAPTIVE WEBGL <i/> DESKTOP + MOBILE</span></div>
    </section>}

    {screen === "tracks" && <section className="content-screen">
      <div className="section-heading"><div><p className="overline">CHOOSE YOUR BATTLEFIELD</p><h2>SELECT <em>TRACK.</em></h2><p>Every route is built for a different kind of driver.</p></div><div className="section-count">01 <span>/ 03</span></div></div>
      <div className="track-grid">{TRACKS.map((item, index) => <button key={item.id} className={"track-card" + (trackId === item.id ? " selected" : "")} onClick={() => setTrackId(item.id)} style={{ "--primary": item.primary, "--secondary": item.secondary, "--track-sky": item.sky, "--track-ground": item.ground } as CSSProperties}>
        <div className={"track-art track-art-" + item.id}><div className="art-grid"/><div className="art-ring"/><div className="art-road"/><div className="art-sun"/></div>
        <div className="track-card-info"><div className="track-index">TRACK 00{index + 1} <span>{item.length}</span></div><h3>{item.name}</h3><p>{item.tagline}</p><div className="track-tags"><span>{item.environment}</span><span>3 LAPS</span></div></div><span className="select-mark">{trackId === item.id ? "✓" : "↗"}</span>
      </button>)}</div>
      <div className="selection-footer"><div className="selection-meta"><div><small>SELECTED CIRCUIT</small><b>{track.name} <span>·</span> {track.environment}</b></div><small className="personal-best">{best ? "PERSONAL BEST // " + time(best) : "FIRST RUN // SET YOUR LAP RECORD"}</small></div><label className="difficulty-picker"><small>AI DIFFICULTY</small><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}><option value="easy">EASY</option><option value="medium">MEDIUM</option><option value="hard">HARD</option></select></label><button className="btn btn-primary" onClick={() => setScreen("garage")}>CHOOSE YOUR CAR <span>→</span></button></div>
    </section>}

    {screen === "garage" && <section className="content-screen garage-screen">
      <div className="section-heading"><div><p className="overline">YOUR MACHINES. YOUR RULES.</p><h2>THE <em>GARAGE.</em></h2><p>Unlock a machine, then make it yours.</p></div><div className="garage-token"><span>◆</span> {save.coins.toLocaleString()} CR AVAILABLE</div></div>
      <div className="garage-layout"><div className="car-display" style={{ "--paint": paint, "--accent": car.accent } as CSSProperties}><div className="display-grid"/><div className="display-glow"/><div className="display-topline"><span>VEHICLE // {String(CARS.findIndex(x => x.id === car.id) + 1).padStart(2, "0")}</span><span>{owned ? "OWNED" : "LOCKED"}</span></div><CarArt color={paint} accent={car.accent} large/><div className="display-name"><p>{car.model}</p><h3>{car.name}</h3><span>{car.description}</span></div><div className="display-stats"><div><small>TOP SPEED</small><b>{car.topSpeed + levels.engine * 6}<i>KM/H</i></b><div className="stat-bar"><i style={{ width: Math.min(100, (car.topSpeed + levels.engine * 6) / 2.9) + "%" }}/></div></div><div><small>ACCELERATION</small><b>{car.acceleration + levels.engine * 2}<i>POWER</i></b><div className="stat-bar"><i style={{ width: Math.min(100, (car.acceleration + levels.engine * 2) * 2.1) + "%" }}/></div></div><div><small>HANDLING</small><b>{Math.round((car.handling + levels.handling * .06) * 100)}<i>%</i></b><div className="stat-bar"><i style={{ width: Math.min(100, (car.handling + levels.handling * .06) * 78) + "%" }}/></div></div><div><small>DURABILITY</small><b>{car.durability + levels.armor * 10}<i>HP</i></b><div className="stat-bar"><i style={{ width: Math.min(100, (car.durability + levels.armor * 10) / 1.6) + "%" }}/></div></div></div></div>
      <div className="garage-side"><div className="car-list-head"><span>AVAILABLE MACHINES</span><small>{save.ownedCars.length} / {CARS.length} OWNED</small></div><div className="car-list">{CARS.map((item, index) => { const isOwned = save.ownedCars.includes(item.id); return <button key={item.id} className={"car-option" + (carId === item.id ? " selected" : "")} onClick={() => setCarId(item.id)}><div className="car-option-number">0{index + 1}</div><div className="car-swatch" style={{ background: item.color, boxShadow: "0 0 20px " + item.color + "55" }}/><div className="car-option-copy"><b>{item.name}</b><small>{item.model}</small></div><div className="car-option-price">{isOwned ? <span className="owned-tag">OWNED</span> : <><b>◆ {item.price.toLocaleString()}</b><small>UNLOCK</small></>}</div></button>; })}</div>
        <div className="skin-panel"><div className="panel-title"><b>PAINT & FINISH</b><small>CHOOSE YOUR COLOR</small></div><div className="skin-list">{SKINS.map((skin) => { const available = save.unlockedSkins.includes(skin.id) || save.unlockedSkins.includes(skin.name); const active = paint.toLowerCase() === skin.color.toLowerCase(); return <button key={skin.id} title={skin.name + (available ? "" : " · " + skin.price + " CR")} aria-label={skin.name} className={"skin-swatch" + (active ? " active" : "") + (!available ? " locked" : "")} style={{ "--skin": skin.color } as CSSProperties} onClick={() => buySkin(skin)}>{active ? "✓" : !available ? "◆" : ""}</button>; })}</div><div className="skin-hint">{SKINS.find(s => s.color.toLowerCase() === paint.toLowerCase())?.name ?? "CUSTOM FINISH"} <span>· OWNED PAINTS ARE SHARED</span></div></div>
        <div className="garage-actions">{!owned ? <button className="btn btn-primary btn-full" onClick={buyCar}>UNLOCK FOR ◆ {car.price.toLocaleString()}</button> : <><button className="btn btn-primary" onClick={() => setScreen("upgrades")}>TUNE THIS CAR ↗</button><button className="btn btn-ghost" onClick={goTracks}>SELECT TRACK</button></>}</div>
      </div></div>
    </section>}

    {screen === "upgrades" && <section className="content-screen">
      <div className="section-heading"><div><p className="overline">EVERY ADVANTAGE COUNTS</p><h2>PERFORMANCE <em>LAB.</em></h2><p>Build your {car.name} around your driving style.</p></div><button className="btn btn-ghost" onClick={goGarage}>← BACK TO GARAGE</button></div>
      <div className="upgrade-hero"><div className="upgrade-car"><CarArt color={paint} accent={car.accent} large/><div><small>ACTIVE VEHICLE</small><h3>{car.name}</h3><span>PERFORMANCE RATING <b>{score}</b></span></div></div><div className="wallet-large"><small>YOUR CREDITS</small><b>◆ {save.coins.toLocaleString()}</b><span>Earn more by racing and taking down rivals.</span></div></div>
      <div className="upgrade-grid">{UPGRADES.map((upgrade) => { const level = levels[upgrade.id]; const price = upgrade.basePrice * (level + 1); return <article key={upgrade.id} className="upgrade-card"><div className="upgrade-icon">{upgrade.icon}</div><div className="upgrade-title"><h3>{upgrade.name}</h3><p>{upgrade.description}</p></div><div className="upgrade-level"><span>LEVEL</span><b>{level}<small> / 5</small></b><div className="level-track">{[1,2,3,4,5].map(n => <i key={n} className={n <= level ? "filled" : ""}/>)}</div></div><button className={"btn " + (level >= 5 ? "btn-disabled" : "btn-primary")} disabled={level >= 5} onClick={() => buyUpgrade(upgrade)}>{level >= 5 ? "MAX LEVEL" : "UPGRADE · ◆ " + price.toLocaleString()}</button></article>; })}</div>
      <p className="economy-note">CREDITS ARE SAVED ON THIS DEVICE. RACE COMPLETIONS AND HIGH-SPEED TAKEDOWNS EARN MORE.</p>
    </section>}

    {screen === "race" && <section className="race-screen" style={{ "--track-primary": track.primary, "--track-secondary": track.secondary } as CSSProperties}>
      <canvas ref={canvas} className="world" aria-label="Interactive NEXRUSH 3D race"/>
      <div className="race-vignette"/>
      <div className="race-topline"><div><small>{track.name} / 3-LAP CIRCUIT</small><b>{car.name}</b></div><div className="race-status"><i/> {engineError ? "ENGINE ERROR" : raceData.racePhase === "COUNTDOWN" ? "GRID READY" : raceData.racePhase === "GO" ? "GO GO GO" : "RACE LIVE"}</div><div className="race-tools"><label>QUALITY <select value={quality} onChange={e => setQuality(e.target.value as QualityMode)}><option value="auto">AUTO</option><option value="low">PERFORMANCE</option><option value="medium">BALANCED</option><option value="high">HIGH</option></select></label><button onClick={() => game.current?.resetCar()} title="Restart race">↻</button><button onClick={() => setHelp(v => !v)} title="Controls">?</button></div></div>
      <div className="race-left"><small>GROUND SPEED <i>KM/H</i></small><div className="race-speed">{Math.round(raceData.speed).toString().padStart(3, "0")}<span>KM/H</span></div><div className="speed-meter"><i style={{ width: Math.min(100, raceData.speed / (car.topSpeed + levels.engine * 6) * 100) + "%" }}/></div><div className="race-metrics"><span><small>GEAR</small><b>{raceData.gear}</b></span><span><small>ENGINE</small><b>{Math.round(raceData.rpm).toLocaleString()} <i>RPM</i></b></span><span><small>POSITION</small><b>P{String(raceData.position).padStart(2, "0")}</b></span><span><small>LAP</small><b>{Math.min(3, raceData.lap)}<i> / 3</i></b></span></div><div className="nitro-panel"><div><b>ϟ NITRO</b><span>{Math.round(raceData.nitro)}%</span></div><div className="nitro-meter"><i style={{ width: raceData.nitro + "%" }}/></div><small>SPACE / BOOST BUTTON</small></div></div>
      <div className="race-right"><small>{raceData.racePhase === "COUNTDOWN" ? "RACE STARTS IN" : "SESSION TIME"}</small><b>{raceData.racePhase === "COUNTDOWN" ? String(raceData.countdown) : time(raceData.elapsed)}</b><div className="race-lap"><span>LAST LAP</span><strong>{raceData.lastLapTime ? time(raceData.lastLapTime) : "--:--.--"}</strong></div><div className="race-lap"><span>BEST LAP</span><strong>{raceData.bestLapTime ? time(raceData.bestLapTime) : "--:--.--"}</strong></div><div className="race-difficulty">{difficulty.toUpperCase()} AI <i/> {raceData.takedowns} TAKEDOWNS</div></div>
      {raceData.racePhase !== "RACING" && <div className={"race-start" + (raceData.racePhase === "GO" ? " go" : "")}><small>{raceData.racePhase === "COUNTDOWN" ? "RACE SEQUENCE // PREPARE" : "RACE SEQUENCE"}</small><b>{raceData.racePhase === "COUNTDOWN" ? raceData.countdown : "GO!"}</b><span>{raceData.racePhase === "COUNTDOWN" ? "HOLD YOUR LINE" : "FULL THROTTLE"}</span></div>}
      {help && <aside className="controls-panel"><button className="close-help" onClick={() => setHelp(false)}>×</button><b>DRIVER CONTROLS</b><span>W / ↑ — ACCELERATE</span><span>S / ↓ — BRAKE / REVERSE</span><span>A / D — STEER</span><span>SPACE — NITRO BOOST</span><span>SHIFT — DRIFT / HANDBRAKE</span><span>R — RESET RACE</span><small>TOUCH CONTROLS ON MOBILE</small></aside>}
      {toast && <div className="race-toast">{toast}</div>}
      <div className="race-mobile-controls"><div className="steer-buttons"><button onPointerDown={e => {e.preventDefault(); control("left", true);}} onPointerUp={() => control("left", false)} onPointerLeave={() => control("left", false)} onPointerCancel={() => control("left", false)}>◀</button><button onPointerDown={e => {e.preventDefault(); control("right", true);}} onPointerUp={() => control("right", false)} onPointerLeave={() => control("right", false)} onPointerCancel={() => control("right", false)}>▶</button></div><div className="pedal-buttons"><button className="drift-button" onPointerDown={e => {e.preventDefault(); control("handbrake", true);}} onPointerUp={() => control("handbrake", false)} onPointerLeave={() => control("handbrake", false)} onPointerCancel={() => control("handbrake", false)}>DRIFT</button><button className="boost-button" onPointerDown={e => {e.preventDefault(); control("nitro", true);}} onPointerUp={() => control("nitro", false)} onPointerLeave={() => control("nitro", false)} onPointerCancel={() => control("nitro", false)}>ϟ BOOST</button><button className="accelerate-button" onPointerDown={e => {e.preventDefault(); control("accelerate", true);}} onPointerUp={() => control("accelerate", false)} onPointerLeave={() => control("accelerate", false)} onPointerCancel={() => control("accelerate", false)}>GAS ▲</button><button className="brake-button" onPointerDown={e => {e.preventDefault(); control("brake", true);}} onPointerUp={() => control("brake", false)} onPointerLeave={() => control("brake", false)} onPointerCancel={() => control("brake", false)}>BRAKE ▼</button></div></div>
      <div className="race-bottom"><button onClick={() => { game.current?.resetCar(); setScreen("tracks"); }}>EXIT RACE</button><span>ADAPTIVE RENDERING · WEBGL</span><span>{track.name} · {difficulty.toUpperCase()}</span></div>
    </section>}

    {screen === "results" && <section className="results-screen"><div className="result-glow"/><div className="result-label">RACE COMPLETE <span>·</span> {track.name}</div><h2>{result?.position === 1 ? "GRID" : "RACE"}<br/><em>{result?.position === 1 ? "DOMINATOR." : "FINISHED."}</em></h2><p>Three laps in the books. The next grid is waiting.</p><div className="result-stats"><div><small>FINAL POSITION</small><b>P{String(result?.position ?? raceData.position).padStart(2,"0")}</b></div><div><small>RACE TIME</small><b>{time(result?.elapsed ?? raceData.elapsed)}</b></div><div><small>TAKEDOWNS</small><b>{raceData.takedowns}</b></div><div><small>CREDITS EARNED</small><b className="credit-number">+{result?.reward ?? 0} CR</b></div></div><div className="result-actions"><button className="btn btn-primary" onClick={startRace}>RACE AGAIN ↗</button><button className="btn btn-ghost" onClick={goTracks}>CHANGE TRACK</button><button className="btn btn-ghost" onClick={goGarage}>GARAGE</button><button className="btn btn-ghost" onClick={back}>MAIN MENU</button></div></section>}

    {screen !== "race" && <footer className="global-footer"><span>NEXRUSH © 2026</span><span>BUILT FOR THE OPEN ROAD <i/> OPEN-WORLD AMBITIONS</span><span>PROTOTYPE / 0.5.0</span></footer>}
    {toast && screen !== "race" && <div className="toast" role="status">{toast}<button onClick={() => setToast("")}>×</button></div>}
    {engineError && screen === "home" && <div className="error-banner"><b>3D ENGINE COULD NOT START.</b> Try a current Chrome/Edge browser with hardware acceleration enabled.<button onClick={() => setEngineError(false)}>×</button></div>}
  </main>;
}
export default App;
