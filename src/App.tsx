import {useCallback,useEffect,useRef,useState} from "react";
import type {RacingScene,QualityMode,Telemetry} from "./game/RacingScene";
const empty:Telemetry={speed:0,rpm:900,gear:1,elapsed:0,lap:1,position:4,offTrack:false,driftAngle:0};
export default function App(){
 const canvas=useRef<HTMLCanvasElement>(null);const game=useRef<RacingScene|null>(null);
 const [quality,setQuality]=useState<QualityMode>("auto");const qualityRef=useRef<QualityMode>("auto");const [data,setData]=useState(empty);const [ready,setReady]=useState(false);const [help,setHelp]=useState(false);const [engineError,setEngineError]=useState(false);
 useEffect(()=>{
  const targetCanvas=canvas.current;
  if(!targetCanvas)return;
  let instance:RacingScene|null=null;
  let cancelled=false;
  const fail=(error:unknown)=>{
   console.error("NEXRUSH could not initialize WebGL.",error);
   if(!cancelled){setReady(false);setEngineError(true);}
  };
  void import("./game/RacingScene").then(({RacingScene})=>{
   if(cancelled)return;
   try{
    const created=new RacingScene(targetCanvas,setData);
    created.setQuality(qualityRef.current);
    instance=created;
    game.current=created;
    void created.start().then(()=>{if(!cancelled)setReady(true)}).catch(fail);
   }catch(error){fail(error);}
  }).catch(fail);
  return ()=>{
   cancelled=true;
   if(instance)instance.dispose();
   if(game.current===instance)game.current=null;
  };
 },[]);
 useEffect(()=>{qualityRef.current=quality;game.current?.setQuality(quality)},[quality]);
 const control=useCallback((key:string,down:boolean)=>game.current?.setControl(key,down),[]);
 const time=(s:number)=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}.${String(Math.floor(s%1*100)).padStart(2,"0")}`;
 return <main className="shell"><canvas ref={canvas} className="world" aria-label="Interactive 3D NEXRUSH racing circuit"/><div className="shade"/>
 <header className="top"><a className="logo" href="#"><b>N</b><span>NEX<span>RUSH</span><small>RACING DIVISION</small></span></a><div className="live"><i className={ready?"":"loading"}/>{engineError?"WEBGL UNAVAILABLE":ready?"SIMULATION LIVE":"INITIALIZING ENGINE"}</div><div className="actions"><label>QUALITY <select value={quality} onChange={e=>setQuality(e.target.value as QualityMode)}><option value="auto">AUTO</option><option value="low">PERFORMANCE</option><option value="medium">BALANCED</option><option value="high">HIGH</option></select></label><button className="resetbtn" onClick={()=>game.current?.resetCar()} aria-label="Reset car" title="Reset car (R)">↻</button><button className="helpbtn" onClick={()=>setHelp(v=>!v)} aria-label="Show controls">?</button></div></header>
 {engineError&&<aside className="engine-error" role="alert"><b>GRAPHICS ENGINE UNAVAILABLE</b><p>Check your connection, enable browser hardware acceleration, and make sure WebGL is supported. Then reload NEXRUSH.</p></aside>}
 <section className="headline"><div className="eyebrow"><i/> PROVING GROUNDS <span>TRACK 001 / LAP {data.lap}</span></div><h1>OWN THE<br/><em>APEX.</em></h1><p>Three rivals. One circuit. Find your line.</p></section>
 <section className="telemetry"><div className="muted">GROUND SPEED <span>KM/H</span></div><div className="speed">{Math.round(data.speed).toString().padStart(3,"0")}<small>KM/H</small></div><div className="meter"><i style={{width:`${Math.min(100,data.speed/2.2)}%`}}/></div><div className="stats"><div><small>GEAR</small><b>{data.gear}</b></div><div><small>ENGINE</small><b>{Math.round(data.rpm).toLocaleString()}<sup> RPM</sup></b></div><div><small>SESSION</small><b>{time(data.elapsed)}</b></div><div><small>POSITION</small><b>P{String(data.position).padStart(2,"0")}</b></div></div></section>
 <div className={`track ${data.offTrack?"offtrack":""}`}><i/>{data.offTrack?"OFF TRACK // LOW GRIP":"CIRCUIT // N-01"} <span>{data.offTrack?"RETURN TO ROAD":"DRY · DAY"}</span></div><div className="hinttime"><small>LAP {data.lap} · FREE RACE</small><b>{time(data.elapsed)}</b></div>
 {help&&<aside className="help"><b>CONTROLS</b><span>W / ↑ Accelerate</span><span>S / ↓ Brake & reverse</span><span>A D / ← → Steer</span><span>SPACE Handbrake</span><span>R Reset car</span><span>Touch controls on mobile</span></aside>}
 <div className="bottomleft"><b>◈ &nbsp; FREE RACE</b><small>3 AI RIVALS // GRID ACTIVE</small><small className={Math.abs(data.driftAngle)>10?"drift-active":"drift-idle"}>{Math.abs(data.driftAngle)>10 ? "DRIFT ANGLE // " + Math.abs(data.driftAngle) + "°" : "DRIFT CONTROL // READY"}</small><small className="adaptive">ADAPTIVE RENDERING · WEBGL</small></div>
 <div className="bottomright"><div className="touch">{[["left","◀"],["brake","▼"],["accelerate","▲"],["right","▶"],["handbrake","✦"]].map(([k,label])=><button key={k} className={k==="accelerate"?"boost":k==="handbrake"?"handbrake":""} aria-label={k} onPointerDown={e=>{e.preventDefault();control(k,true)}} onPointerUp={()=>control(k,false)} onPointerLeave={()=>control(k,false)} onPointerCancel={()=>control(k,false)}>{label}</button>)}</div><small className="keys">W THROTTLE　 S BRAKE　 SPACE HANDBRAKE</small></div>
 <footer><span>NEXRUSH © 2026</span><span>BUILT FOR THE OPEN ROAD　◆</span><span>PROTOTYPE 0.3.0</span></footer></main>
}
