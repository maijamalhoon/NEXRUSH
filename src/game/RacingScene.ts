import {ArcRotateCamera,Color3,Color4,Engine,HemisphericLight,Mesh,MeshBuilder,PBRMaterial,Scene,StandardMaterial,Vector3} from "@babylonjs/core";
export type QualityMode="auto"|"low"|"medium"|"high";
export interface Telemetry{speed:number;rpm:number;gear:number;elapsed:number}
type Control="left"|"right"|"accelerate"|"brake"|"handbrake";
const scales={low:1.55,medium:1.22,high:1};
export class RacingScene{
 private engine:Engine;private scene:Scene;private camera:ArcRotateCamera;private car:Mesh;private wheels:Mesh[]=[];private keys=new Set<string>();private controls=new Set<Control>();private mode:QualityMode="auto";private speed=0;private heading=0;private elapsed=0;private fpsFrames=0;private fpsStart=performance.now();private lowSamples=0;private autoScale=1.22;private disposed=false;private lastHud=0;
 private down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();this.keys.add(k)};
 private up=(e:KeyboardEvent)=>this.keys.delete(e.key.toLowerCase());
 private clear=()=>{this.keys.clear();this.controls.clear()};
 constructor(canvas:HTMLCanvasElement,private onTelemetry:(t:Telemetry)=>void){
  this.engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,antialias:false,powerPreference:"high-performance",adaptToDeviceRatio:false});
  this.engine.setHardwareScalingLevel(Math.max(1,Math.min(1.5,window.devicePixelRatio||1)));
  this.scene=new Scene(this.engine);this.scene.clearColor=new Color4(.025,.035,.065,1);this.scene.skipPointerMovePicking=true;
  this.camera=new ArcRotateCamera("chase",-Math.PI/2,1.08,13,new Vector3(0,.7,0),this.scene);this.camera.lowerRadiusLimit=9;this.camera.upperRadiusLimit=17;this.camera.inputs.clear();
  this.car=this.makeCar();this.makeTrack();this.makeWorld();this.applyQuality();
  window.addEventListener("keydown",this.down,{passive:false});window.addEventListener("keyup",this.up);window.addEventListener("blur",this.clear);document.addEventListener("visibilitychange",this.clear);
 }
 async start(){if(this.disposed)return;this.engine.runRenderLoop(()=>{if(this.disposed)return;const dt=Math.min(this.engine.getDeltaTime()/1000,.05);if(!document.hidden)this.update(dt);this.scene.render();this.monitor()});window.addEventListener("resize",this.resize)}
 private resize=()=>{if(!this.disposed){this.engine.resize();this.applyQuality()}};
 setControl(key:string,pressed:boolean){if(!["left","right","accelerate","brake"].includes(key))return;if(pressed)this.controls.add(key as Control);else this.controls.delete(key as Control)}
 setQuality(q:QualityMode){this.mode=q;this.applyQuality()}
 private applyQuality(){const scale=this.mode==="auto"?this.autoScale:scales[this.mode];this.engine.setHardwareScalingLevel(1/scale)}
 private monitor(){this.fpsFrames++;const now=performance.now();if(now-this.fpsStart<1800)return;const fps=this.fpsFrames*1000/(now-this.fpsStart);this.fpsFrames=0;this.fpsStart=now;if(this.mode!=="auto")return;if(fps<42)this.lowSamples++;else this.lowSamples=Math.max(0,this.lowSamples-1);if(this.lowSamples>=2&&this.autoScale>.62){this.autoScale=Math.max(.62,this.autoScale-.08);this.lowSamples=0;this.applyQuality()}else if(fps>57&&this.autoScale<1.1){this.autoScale=Math.min(1.1,this.autoScale+.03);this.applyQuality()}}
 private update(dt:number){
  this.elapsed+=dt;const accel=this.keys.has("w")||this.keys.has("arrowup")||this.controls.has("accelerate");const brake=this.keys.has("s")||this.keys.has("arrowdown")||this.controls.has("brake");const left=this.keys.has("a")||this.keys.has("arrowleft")||this.controls.has("left");const right=this.keys.has("d")||this.keys.has("arrowright")||this.controls.has("right");const hand=this.keys.has(" ")||this.controls.has("handbrake");
  this.speed+=accel?30*dt:-7*dt;if(brake)this.speed-=48*dt;if(hand)this.speed-=14*dt;this.speed=Math.max(-12,Math.min(240,this.speed));
  this.heading+=(Number(right)-Number(left))*Math.min(1,Math.abs(this.speed)/28)*dt*(hand?1.8:1.05)*Math.sign(this.speed||1);
  const forward=new Vector3(Math.sin(this.heading),0,Math.cos(this.heading));this.car.position.addInPlace(forward.scale(this.speed*dt/3.6));this.car.rotation.y=this.heading;
  this.car.position.x=Math.max(-48,Math.min(48,this.car.position.x));this.car.position.z=Math.max(-48,Math.min(48,this.car.position.z));for(const wheel of this.wheels)wheel.rotation.x+=this.speed*dt/1.2;
  this.camera.target=Vector3.Lerp(this.camera.target,this.car.position.add(new Vector3(0,.65,0)),Math.min(1,dt*5));this.camera.alpha=-Math.PI/2-this.heading;this.camera.beta=1.08+Math.min(.12,Math.abs(this.speed)/1200);this.camera.radius=12+Math.min(3,Math.abs(this.speed)/70);
  if(this.elapsed-this.lastHud>.08){this.lastHud=this.elapsed;this.onTelemetry({speed:Math.abs(this.speed),gear:Math.max(1,Math.min(6,Math.floor(Math.max(0,this.speed)/38)+1)),rpm:900+Math.abs(this.speed)%38*165+(accel?900:0),elapsed:this.elapsed})}
 }
 private makeCar(){const body=MeshBuilder.CreateBox("player-car",{width:1.9,height:.52,depth:3.8},this.scene);body.position.y=.65;const paint=new PBRMaterial("racing-red",this.scene);paint.albedoColor=new Color3(.72,.035,.12);paint.metallic=.72;paint.roughness=.28;body.material=paint;
  const cabin=MeshBuilder.CreateBox("canopy",{width:1.35,height:.48,depth:1.55},this.scene);cabin.position.set(0,1.1,-.15);cabin.parent=body;const glass=new StandardMaterial("glass",this.scene);glass.diffuseColor=new Color3(.035,.12,.18);glass.emissiveColor=new Color3(.01,.07,.09);cabin.material=glass;
  const rubber=new StandardMaterial("rubber",this.scene);rubber.diffuseColor=new Color3(.035,.04,.055);for(const x of [-.98,.98])for(const z of [-1.2,1.2]){const w=MeshBuilder.CreateCylinder("wheel",{diameter:.78,height:.32,tessellation:12},this.scene);w.rotation.z=Math.PI/2;w.position.set(x,.38,z);w.material=rubber;w.parent=body;this.wheels.push(w)}
  const spoiler=MeshBuilder.CreateBox("spoiler",{width:1.75,height:.08,depth:.28},this.scene);spoiler.position.set(0,.5,-1.6);spoiler.parent=body;return body}
 private makeTrack(){const ground=MeshBuilder.CreateGround("ground",{width:140,height:140},this.scene);const gm=new StandardMaterial("ground-mat",this.scene);gm.diffuseColor=new Color3(.055,.075,.095);gm.specularColor=Color3.Black();ground.material=gm;
  const roadMat=new StandardMaterial("road-mat",this.scene);roadMat.diffuseColor=new Color3(.12,.15,.19);const cyan=new StandardMaterial("cyan",this.scene);cyan.emissiveColor=new Color3(0,.78,.95);const pink=new StandardMaterial("pink",this.scene);pink.emissiveColor=new Color3(.95,.035,.3);
  const road=MeshBuilder.CreateGround("circuit",{width:28,height:80},this.scene);road.material=roadMat;
  for(const z of [-40,-30,-20,-10,0,10,20,30,40]){const dash=MeshBuilder.CreateBox("road-mark",{width:.18,height:.025,depth:3.2},this.scene);dash.position.set(0,.025,z);dash.material=cyan}
  for(const x of [-14.5,14.5]){const edge=MeshBuilder.CreateBox("neon-edge",{width:.16,height:.11,depth:80},this.scene);edge.position.set(x,.05,0);edge.material=x<0?cyan:pink}
  for(const z of [-34,-17,0,17,34])for(const x of [-24,24]){const p=MeshBuilder.CreateCylinder("pylon",{height:2.2,diameter:.4,tessellation:8},this.scene);p.position.set(x,1.1,z);p.material=x<0?cyan:pink}
  const line=MeshBuilder.CreateGround("start-line",{width:27.8,height:1.2},this.scene);line.position.set(0,.035,29);const fm=new StandardMaterial("finish",this.scene);fm.diffuseColor=new Color3(.8,.9,1);fm.emissiveColor=new Color3(.15,.22,.28);line.material=fm}
 private makeWorld(){const sky=MeshBuilder.CreateBox("sky",{size:1000},this.scene);const sm=new StandardMaterial("sky-mat",this.scene);sm.backFaceCulling=false;sm.disableLighting=true;sm.emissiveColor=new Color3(.025,.04,.085);sky.material=sm;sky.isPickable=false;const light=new HemisphericLight("ambient",new Vector3(0,1,0),this.scene);light.intensity=.95;light.groundColor=new Color3(.06,.08,.13);const orb=MeshBuilder.CreateSphere("neon-orb",{diameter:3,segments:8},this.scene);orb.position.set(-20,12,28);const om=new StandardMaterial("orb-mat",this.scene);om.emissiveColor=new Color3(.02,.45,.75);orb.material=om}
 dispose(){this.disposed=true;window.removeEventListener("keydown",this.down);window.removeEventListener("keyup",this.up);window.removeEventListener("blur",this.clear);window.removeEventListener("resize",this.resize);document.removeEventListener("visibilitychange",this.clear);this.engine.stopRenderLoop();this.scene.dispose();this.engine.dispose()}
}