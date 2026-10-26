import {useCallback,useEffect,useRef,useState} from "react";
import {RacingScene,type QualityMode,type Telemetry} from "./game/RacingScene";
const empty:Telemetry={speed:0,rpm:900,gear:1,elapsed:0};
export default function App(){
 const canvas=useRef<HTMLCanvasElement>(null);const game=useRef<RacingScene|null>(null);
 const [quality,setQuality]=useState<QualityMode>("auto");const [data,setData]=useState(empty);const [ready,setReady]=useState(false);const [help,setHelp]=useState(false);
 useEffect(()=>{if(!canvas.current)return;const instance=new RacingScene(canvas.current,setData);game.current=instance;void instance.start().then(()=>setReady(true)).catch(console.error);return()=>{game.current=null;instance.dispose()}},[]);
 useEffect(()=>{game.current?.setQuality(quality)},[quality]);
 const control=useCallback((key:string,down:boolean)=>game.current?.setControl(key,down),[]);
 const time=(s:number)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}.${String(Math.floor(s%1*100)).padStart(2,"0")}`;
 return <main className="shell"><canvas ref={canvas} className="world" aria-label="Interactive 3D racing track"/><div className="shade"/>
 <header className="top"><a className="logo" href="#"><b>N</b><span>NEX<span>RUSH</span><small>RACING DIVISION</small></span></a><div className="live"><i className={ready?"":"loading"}/>{ready?"SIMULATION LIVE":"INITIALIZING ENGINE"}</div><div className="actions"><label>QUALITY <select value={quality} onChange={e=>setQuality(e.target.value as QualityMode)}><option value="auto">AUTO</option><option value="low">PERFORMANCE</option><option value="medium">BALANCED</option><option value="high">HIGH</option></select></label><button className="helpbtn" onClick={()=>setHelp(v=>!v)} aria-label="Show controls">?</button></div></header>
 <section className="headline"><div className="eyebrow"> <i/> PROVING GROUNDS <span>TRACK 001 / SOLO TEST</span></div><h1>OWN THE<br/><em>APEX.</em></h1><p>Every millisecond matters. Find your line.</p></section>
 <section className="telemetry"><div className="muted">GROUND SPEED <span>KM/H</span></div><div className="speed">{Math.round(data.speed).toString().padStart(3,"0")}<small>KM/H</small></div><div className="meter"><i style={{width:`${Math.min(100,data.speed/2.4)}%`}}/></div><div className="stats"><div><small>GEAR</small><b>{data.gear}</b></div><div><small>ENGINE</small><b>{Math.round(data.rpm).toLocaleString()}<sup> RPM</sup></b></div><div><small>SESSION</small><b>{time(data.elapsed)}</b></div><div><small>POSITION</small><b>P01</b></div></div></section>
 <div className="track"> <i/> CIRCUIT // N-01 <span>DRY · DAY</span></div><div className="hinttime"><small>FREE DRIVE SESSION</small><b>{time(data.elapsed)}</b></div>
 {help&&<aside className="help"><b>CONTROLS</b><span>W / ↑ Accelerate</span><span>S / ↓ Brake & reverse</span><span>A D / ← → Steer</span><span>SPACE Handbrake</span></aside>}
 <div className="bottomleft"><b>◈ &nbsp; FREE DRIVE</b><small>AI GRID // COMING NEXT</small><small className="adaptive">ADAPTIVE RENDERING · WEBGL</small></div>
 <div className="bottomright"><div className="touch">{[["left","◀"],["brake","▼"],["accelerate","▲"],["right","▶"]].map(([k,label])=><button key={k} className={k==="accelerate"?"boost":""} aria-label={k} onPointerDown={()=>control(k,true)} onPointerUp={()=>control(k,false)} onPointerLeave={()=>control(k,false)} onPointerCancel={()=>control(k,false)}>{label}</button>)}</div><small className="keys">W THROTTLE　 S BRAKE　 SPACE HANDBRAKE</small></div>
 <footer><span>NEXRUSH © 2026</span><span>BUILT FOR THE OPEN ROAD　◆</span><span>PROTOTYPE 0.1.0</span></footer></main>
}