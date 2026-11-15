// Figma home poses + source-indexed motion. Shared join poses are locked;
// editable timing and secondary motion never change the cut geometry.
import {el,rect,text,group,width,cursor} from '../svg.js';
import {CARD_TRACKS} from '../data/collage.js';
import {REFERENCE_TRACKS} from '../data/reference-tracks.js';
import {sourceRegion,fitRect,BEATS} from './model.js';
import {imageRegion} from './render.js';
import {settingsFor,motionFrame} from './motion-settings.js';
const clamp=t=>Math.max(0,Math.min(1,t));
export const land=(frame,start,length=6)=>{const t=clamp((frame-start)/length);return t===1?1:(1-Math.pow(.74,t*12))/(1-Math.pow(.74,12));};
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const boxMix=(a,b,t)=>Object.fromEntries(['x','y','width','height'].map(k=>[k,a[k]+(b[k]-a[k])*t]));
const asset=name=>new URL(`../../assets/v2/${name}.svg`,import.meta.url).href;
const logo=asset('base44-lockup'),symbols=Array.from({length:7},(_,i)=>asset(`symbol-${i+1}`));
const FOCUS_IDS=['focus','focus2','focus3'];
export const FIGMA_NODES={hook:['9:167','9:194'],reveal:['9:224'],collage:['9:235'],focus:['9:357'],focus2:['9:411'],focus3:['9:421'],capabilities:['9:431','10:533'],ending:['9:465','9:494']};
const HOME={x:90,y:52,width:780,height:426},FEATURE={x:182,y:154,width:630,height:364},TILE={x:620,y:17,width:195,height:204};
const BUNDLE=[{x:371,y:161,width:218,height:218},{x:198,y:126,width:89,height:89},{x:652,y:410,width:89,height:89},{x:690,y:121,width:211,height:221},{x:137,y:-147,width:211,height:221},{x:-86,y:384,width:211,height:221},{x:125,y:295,width:89,height:89},{x:308,y:505,width:89,height:89},{x:641,y:74,width:47,height:47}];
function surface(p){return mix(p.theme.surface,p.theme.ink,.08);}
function background(p,word=p.app.name){return [rect(0,0,960,540,surface(p)),text(word,-87,179,230,p,{opacity:.04})];}
function markers(b,p,size=10){return [[b.x-size,b.y-size],[b.x+b.width,b.y-size],[b.x-size,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>rect(x,y,size,size,p.theme.ink,{'data-corner':true}));}
function media(m,p,wireframe,index=0){return {...m,wireframe,color:m.color??p.theme.blocks?.[index%p.theme.blocks.length],fontFamily:p.typography.family,label:m.label??'APP SCREEN'};}
function wrap(value,p,size,maxWidth,maxLines){
  for(let s=size;s>=24;s--){const rows=[];let row='';for(const word of value.trim().split(/\s+/)){const next=row?row+' '+word:word;if(row&&width(next,s,p)>maxWidth){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);if(rows.length<=maxLines&&rows.every(r=>width(r,s,p)<=maxWidth))return {rows,size:s};}
  throw Error('Shorten the copy to keep this frame readable.');
}
function words(value,x,y,size,p,frame,interval=2,start=0){let offset=x;return value.split(/\s+/).map((word,i)=>{const w=width(word+' ',size,p),visible=frame>=start+i*interval,n=text(word,offset,y,size,p,{opacity:visible?1:0,'data-type-word':i});offset+=w;return n;});}
export function pageRegion(m,progress,box=HOME){const r=sourceRegion(m),h=Math.min(r.height,m.windowHeight??r.width*box.height/box.width);return {...r,height:h,y:r.y+(r.height-h)*clamp(progress)};}
function windowLayer(m,r,b,p,o,key){return group([
  rect(b.x,b.y,b.width,b.height,p.theme.primary,{'data-match':key==='feature-page'?'feature-window':undefined}),
  imageRegion(media(m,p,o.wireframe),r,b,{'data-app-page':true})
],{'data-match':key});}
function morphWindow(a,ar,b,br,box,t,p,o,key){
  if(a.src===b.src)return windowLayer({...b},boxMix(ar,br,t),box,p,o,key);
  // Different host assets can still share a graphic window; blend only its
  // contents during the move, then cut on the exact target asset and bounds.
  if(t===0)return windowLayer(a,ar,box,p,o,key);
  if(t===1)return windowLayer(b,br,box,p,o,key);
  return group([windowLayer(a,ar,box,p,o,key),group([windowLayer(b,br,box,p,o,key)],{opacity:t})]);
}
function hover(m,r,box,p,frame,o){
  if(o.wireframe||!m.hover||frame<8||o.motion.hover===0)return [];
  const h=m.hover,fit=fitRect(r,box);
  if(h.x<r.x||h.y<r.y||h.x+h.width>r.x+r.width||h.y+h.height>r.y+r.height)return [];
  const lift=land(frame,8,4),amount=o.motion.hover,b={x:fit.x+(h.x-r.x)*fit.scale,y:fit.y+(h.y-r.y)*fit.scale-lift*amount,width:h.width*fit.scale,height:h.height*fit.scale};
  return [rect(b.x,b.y+amount*lift,b.width,b.height,p.theme.primary),imageRegion(media(m,p,false),h,b,{'data-predicted-hover':true}),cursor(b.x+b.width*.72+28*(1-lift),b.y+b.height*.65+20*(1-lift),.8,p)];
}
const featureMedia=f=>({...f.page??f.media,label:f.name});
function component(f){const r=f.media.hover??sourceRegion(f.media);return r.width/r.height>3&&f.page?featureMedia(f):{...f.media,label:f.name,region:r};}
function opening(plan,frame,o){
  const p=plan.source,n=background(p),copy=wrap(p.description,p,44,720,2),top=270-copy.rows.length*copy.size/2,t=o.exit;
  if(t===0){let word=0;copy.rows.forEach((row,i)=>{n.push(...words(row,(960-width(row,copy.size,p))/2,top+i*copy.size,copy.size,p,frame,o.motion.wordFrames,word*o.motion.wordFrames));word+=row.split(/\s+/).length;});n.push(...markers({x:90,y:236,width:780,height:59},p));const c=land(frame,12,9);n.push(cursor(775-165*c,346-69*c,1,p));}
  else {const box=boxMix({x:90,y:236,width:780,height:59},HOME,t),r=pageRegion(p.homepage,0,HOME);n.push(windowLayer(p.homepage,r,box,p,o,'homepage'),...markers(box,p));}
  return n;
}
function homepage(plan,frame,o){
  const p=plan.source,n=background(p),scroll=(frame<21?.5*land(frame,8,8):.5+.5*land(frame,23,8))*o.motion.scroll,r=pageRegion(p.homepage,scroll),t=o.exit,m=component(plan.selected[0]);
  const b=boxMix(HOME,BUNDLE[0],t);
  n.push(morphWindow(p.homepage,r,m,sourceRegion(m),b,t,p,o,t===0?'homepage':'bundle-card'),...markers(b,p));
  if(t===0)n.push(...hover(p.homepage,r,b,p,frame,o));
  return n;
}
function feature(plan,id,frame,o){
  const p=plan.source,i=FOCUS_IDS.indexOf(id),f=plan.selected[i],n=[rect(0,0,960,540,surface(p))],t=id==='focus3'?o.exit:0;
  const wm=wrap(f.name,p,301.529,1150,2);wm.rows.forEach((r,j)=>n.push(text(r,-89,25+j*233,wm.size,p,{opacity:.04*(1-t)})));
  const copy=wrap(f.title,p,44,630,1);n.push(group(words(copy.rows[0],182,87,copy.size,p,frame,o.motion.wordFrames),{opacity:1-t}));
  const m=featureMedia(f),r=sourceRegion(m),b=boxMix(FEATURE,TILE,t);
  n.push(windowLayer(m,r,b,p,o,t>0?'capability-tile':'feature-page'));
  if(!t)n.push(...hover(m,r,b,p,frame,o));
  n.push(group([rect(b.x+b.width,b.y-36,36,36,p.theme.ink),text(String(i+1).padStart(2,'0'),b.x+b.width+18,b.y-25.4,14.294,p,{fill:p.theme.onPrimary,anchor:'middle'})],{opacity:1-t}));
  return n;
}
function bundle(plan,frame,o){
  const p=plan.source,t=o.exit,n=[rect(0,0,960,540,p.theme.accent),text(p.app.name,-598,3,230,p,{opacity:.04}),text(p.app.name,198,370,230,p,{opacity:.04})],photos=p.images??[],a=component(plan.selected[0]),b=featureMedia(plan.selected[0]);
  const roles=[a,component(plan.selected[1]),component(plan.selected[2]),photos[0],photos[1],photos[2],component(plan.selected[2]),component(plan.selected[1]),a];
  for(const i of [4,5,8,1,6,7,2,3]){
    if(!roles[i])continue;const dest=BUNDLE[i],track=CARD_TRACKS[`card${i+1}`].samples,j=Math.min(25,Math.round(frame*25/18)),pose=track[j],home=track[25];if(!pose)continue;
    const s=Math.max(0,1+(pose[2]/home[2]-1)*o.motion.movement),box={x:dest.x+(pose[0]-home[0])*.7*o.motion.movement+(dest.x-480)*t*.3,y:dest.y+(pose[1]-home[1])*.7*o.motion.movement,width:dest.width*s,height:dest.height*s};
    n.push(group([imageRegion(media(roles[i],p,o.wireframe,i),sourceRegion(roles[i]),box,{'data-bundle-role':i>=3&&i<=5?'app-image':'feature'})],{opacity:1-t}));
  }
  const box=boxMix(BUNDLE[0],FEATURE,t);n.push(morphWindow(a,sourceRegion(a),b,sourceRegion(b),box,t,p,o,t===0?'bundle-card':'feature-page'));
  if(t<1)n.push(group(markers(box,p),{opacity:1-t}));
  if(t===0&&frame>0){const c=land(frame,8,6);n.push(cursor(box.x+box.width*.72+(805-box.x-box.width*.72)*(1-c)*o.motion.movement,box.y+box.height*.6,1,p));}
  return n;
}
function symbolRow(){return Array.from({length:6},(_,i)=>{const h=i===1?28.796:i===5?27.102:23.714,w=i===5?27.102:23.714;return el('image',{href:symbols[i],x:251+i*42,y:249+(23.714-h)/2,width:w,height:h,'data-symbol':i});});}
function brandLockup(){return group([el('image',{href:symbols[6],x:506.087,y:247,width:25.006,height:25.067}),el('image',{href:logo,x:562,y:245,width:147,height:25.801,'aria-label':'Base44 official logo'})],{'data-match':'brand-lockup'});}
function capabilities(plan,frame,o){
  const p=plan.source,t=o.exit,swap=smooth((frame-13)/8),n=[rect(0,0,960,540,surface(p))];
  for(const [x,y]of [[-280,-75],[-63,159],[-701,408],[617,408]])n.push(text('Capabilities',x,y,230,p,{opacity:.04*(1-t)}));
  const copy=wrap(p.benefit??`Now you can ${plan.selected[0].title.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())}.`,p,64.719,433,3),x=112+368*swap;
  copy.rows.forEach((r,i)=>n.push(text(r,x,243+i*57.785,copy.size,p,{opacity:(1-t)*Math.abs(1-2*swap),'data-benefit':true})));
  const photos=p.images??[],tiles=[featureMedia(plan.selected[2]),photos[0],photos[1],component(plan.selected[1]),component(plan.selected[0]),photos[2]],baseX=620-610*swap;
  const track=REFERENCE_TRACKS['collage-file-strip'].translation,j=Math.min(track.length-1,Math.floor(frame*2)),drift=(track[j][0]-track[0][0])*.12*o.motion.movement;
  for(let i=0;i<6;i++){
    if(!tiles[i])continue;const home={x:baseX+i%2*203,y:17+Math.floor(i/2)*214+drift,width:195,height:204},target={x:251+i*42,y:249,width:23.714,height:23.714},b=boxMix(home,target,t);
    n.push(group([windowLayer(tiles[i],sourceRegion(tiles[i]),b,p,o,i===0?'capability-tile':undefined)],{opacity:1-t}));
  }
  // Six UI tiles condense into the symbol row. The arrow and official lockup
  // land before the cut and stay unchanged in both ending states.
  n.push(group(symbolRow(),{opacity:t}),group([brandLockup()],{opacity:t}));
  return n;
}
function ending(plan,frame,o){
  const p=plan.source,n=[rect(0,0,960,540,p.theme.surface)];
  if(frame<o.motion.symbolFrames)n.push(...symbolRow());
  else n.push(text('Proudly built on',251,241,33.602,p,{'data-credit':true}));
  n.push(brandLockup());return n;
}
export function renderFigmaFlow(id,rawFrame,plan,options){
  const last=BEATS.find(b=>b.id===id).frames-1,motion=settingsFor(plan.source,id),frame=motionFrame(rawFrame,last,motion.tempo);
  const o={...options,motion,exit:smooth((rawFrame-(last-motion.joinFrames))/motion.joinFrames)};
  const fn=FOCUS_IDS.includes(id)?()=>feature(plan,id,frame,o):({hook:opening,reveal:homepage,collage:bundle,capabilities,ending})[id];
  if(!fn)throw Error(`No Figma layout for ${id}`);
  return [group(fn(plan,frame,o),{'data-design-node':FIGMA_NODES[id].join(','),'data-design-revision':'2026-11-15','data-motion-frame':frame})];
}
