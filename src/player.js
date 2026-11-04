import {FPS,SHOTS,TOTAL_FRAMES,getShot,clampFrame,locateFrame,assertPayload} from './contracts.js';
import {stage} from './svg.js';
import {renderHook} from './shots/hook.js';
import {renderReveal} from './shots/reveal.js';
import {renderCollage} from './shots/collage.js';
import {renderFocus} from './shots/focus.js';
import {renderEnding} from './shots/ending.js';
import {variantRenderers} from './shots/variants.js';
import {getVariant,normalizeVariants} from './variants.js';
export {FPS,SHOTS,TOTAL_FRAMES};
export {SHOT_VARIANTS} from './variants.js';
export const renderers={hook:renderHook,reveal:renderReveal,collage:renderCollage,focus:renderFocus,ending:renderEnding};
const fonts=new Map();
const systemFonts=new Set(['Arial','Georgia','Helvetica','Times New Roman','Courier New','system-ui']);
export async function loadAppFont(p) {
  const {family,src}=p.typography;
  if(!src){if(!systemFonts.has(family))throw new Error(`Missing font asset for ${family}. Supply typography.src.`);return;}
  const key=family+'|'+src;
  if(!fonts.has(key))fonts.set(key,(async()=>{
    const face=new FontFace(family,`url(${JSON.stringify(src)})`,{weight:'100 900',style:'normal'});
    await face.load();document.fonts.add(face);
  })().catch(e=>{fonts.delete(key);throw new Error(`Cannot load app font ${family}: ${e.message}`);}));
  await fonts.get(key);
}
export function renderShot(id,frame,p,options={}) {
  const f=clampFrame(frame,getShot(id).frames);
  const variant=getVariant(id,options.variant).id;
  const renderer=variant==='original'?renderers[id]:variantRenderers[id];
  const svg=stage(renderer(f,p,{wireframe:true,...options,variant}),p,id,f);
  svg.setAttribute('data-variant',variant);return svg;
}
// One frame clock. No CSS easing or wall-clock animation inside a shot.
export async function createMotionPlayer(container,{payload,shot='hook',sequence,variants={},wireframe=true,onFrame=()=>{},onError=()=>{}}={}) {
  let app=assertPayload(payload),order=sequence?.slice()??[shot];order.forEach(getShot);
  let layouts=normalizeVariants(variants);
  if(!order.length)throw new Error('Sequence cannot be empty');
  let total=order.reduce((n,id)=>n+getShot(id).frames,0),frame=0,playing=false,loop=false,raf=0,origin=0,disposed=false,revision=0;
  await loadAppFont(app);
  // Check text capacity for every shot before accepting the payload.
  const check=(p,nextLayouts=layouts)=>{for(const s of SHOTS){try{renderShot(s.id,s.frames-1,p,{wireframe,variant:nextLayouts[s.id]});}catch(error){throw new Error(`${s.name} (${nextLayouts[s.id]}): ${error.message}`);}}};check(app);
  function state(){const local=locateFrame(frame,order);return {frame,seconds:frame/FPS,totalFrames:total,duration:total/FPS,playing,loop,shot:local.shot.id,localFrame:local.frame,variant:layouts[local.shot.id]};}
  function draw(){if(disposed)return;const local=locateFrame(frame,order);container.replaceChildren(renderShot(local.shot.id,local.frame,app,{wireframe,variant:layouts[local.shot.id]}));onFrame(state());}
  function tick(now){if(!playing||disposed)return;let next=Math.floor((now-origin)*FPS/1000);if(next>=total){if(loop){next%=total;origin=now-next*1000/FPS;}else{playing=false;next=total-1;}}
    if(frame!==next||!playing){frame=next;draw();}if(playing)raf=requestAnimationFrame(tick);
  }
  const api={
    play(){if(disposed||playing)return;if(frame>=total-1)frame=0;playing=true;origin=performance.now()-frame*1000/FPS;draw();raf=requestAnimationFrame(tick);},
    pause(){playing=false;cancelAnimationFrame(raf);if(!disposed)onFrame(state());},
    seekFrame(n){if(disposed)return;frame=clampFrame(n,total);origin=performance.now()-frame*1000/FPS;draw();},
    seek(seconds){this.seekFrame(seconds*FPS);},
    setLoop(value){loop=Boolean(value);onFrame(state());},
    setSequence(ids){const next=ids.slice();if(!next.length)throw new Error('Sequence cannot be empty');next.forEach(getShot);this.pause();order=next;total=order.reduce((n,id)=>n+getShot(id).frames,0);frame=0;draw();},
    setShot(id){getShot(id);this.setSequence([id]);},
    setVariant(id,variant){getVariant(id,variant);renderShot(id,getShot(id).frames-1,app,{wireframe,variant});layouts={...layouts,[id]:variant};draw();},
    getVariants(){return {...layouts};},
    async applyTemplate({payload,variants:nextVariants,wireframe:nextWireframe=wireframe}){const ticket=++revision,p=assertPayload(payload),next=normalizeVariants(nextVariants);await loadAppFont(p);if(disposed||ticket!==revision)return false;check(p,next);app=p;layouts=next;wireframe=Boolean(nextWireframe);draw();return true;},
    setWireframe(value){wireframe=Boolean(value);draw();},
    getWireframe(){return wireframe;},
    async update(next){const ticket=++revision,p=assertPayload(next);await loadAppFont(p);if(disposed||ticket!==revision)return false;check(p);app=p;draw();return true;},
    getPayload(){return structuredClone(app);},
    getState:state,
    destroy(){this.pause();disposed=true;revision++;container.replaceChildren();}
  };
  try{draw();}catch(e){onError(e);throw e;}return api;
}
