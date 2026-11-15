// Native layers from fnmudHOvdfW16D6TjhEFz2, revised 2026-11-15.
// Static home poses are Figma's. Motion is a declared adaptation of measured
// Present Flow/SH22 paths, source-indexed pop/hold cadence and B44-06's glyph row.
import {el,rect,text,group,width,cursor} from '../svg.js';
import {CARD_TRACKS} from '../data/collage.js';
import {REFERENCE_TRACKS} from '../data/reference-tracks.js';
import {sourceRegion,fitRect} from './model.js';
import {imageRegion} from './render.js';

const clamp=t=>Math.max(0,Math.min(1,t));
// Sampled at 12 fps from a 24 fps score. No wall-clock or random state.
export const land=(frame,start,length=6)=>{const t=clamp((frame-start)/length);return t===1?1:(1-Math.pow(.74,t*12))/(1-Math.pow(.74,12));};
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const asset=name=>new URL(`../../assets/v2/${name}.svg`,import.meta.url).href;
const logo=asset('base44-lockup');
const symbols=Array.from({length:7},(_,i)=>asset(`symbol-${i+1}`));
const FOCUS_IDS=['focus','focus2','focus3'];
export const FIGMA_NODES={hook:['9:167','9:194'],reveal:['9:224'],collage:['9:235'],focus:['9:357'],focus2:['9:411'],focus3:['9:421'],capabilities:['9:431','10:533'],ending:['9:465','9:494']};
const HOME={x:90,y:52,width:780,height:426};
const FEATURE={x:182,y:154,width:630,height:364};
function surface(p){return mix(p.theme.surface,p.theme.ink,.08);}
function background(p,word=p.app.name){return [rect(0,0,960,540,surface(p)),text(word,-87,179,230,p,{opacity:.04})];}
function markers(box,p,size=10){return [[box.x-size,box.y-size],[box.x+box.width,box.y-size],[box.x-size,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>rect(x,y,size,size,p.theme.ink,{'data-corner':true}));}
function media(m,p,wireframe,index=0){return {...m,wireframe,color:m.color??p.theme.blocks?.[index%p.theme.blocks.length],fontFamily:p.typography.family,label:m.label??'APP SCREEN'};}
function wrap(value,p,size,maxWidth,maxLines){
  for(let s=size;s>=24;s-=1){const rows=[];let row='';for(const word of value.trim().split(/\s+/)){const next=row?row+' '+word:word;if(row&&width(next,s,p)>maxWidth){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);if(rows.length<=maxLines&&rows.every(r=>width(r,s,p)<=maxWidth))return {rows,size:s};}
  throw Error('Shorten the copy to keep this frame readable.');
}
function words(value,x,y,size,p,frame,start=0){let offset=x;return value.split(/\s+/).map((word,i)=>{const w=width(word+' ',size,p),visible=frame>=start+i*2;const n=text(word,offset,y,size,p,{opacity:visible?1:0,'data-type-word':i});offset+=w;return n;});}
// Viewport dimensions follow the source, not a portrait template. A page can
// scroll only through pixels the host actually supplied.
export function pageRegion(m,progress,box=HOME){const r=sourceRegion(m);const h=Math.min(r.height,m.windowHeight??r.width*box.height/box.width);return {...r,height:h,y:r.y+(r.height-h)*clamp(progress)};}
function page(m,box,p,frame,wireframe,progress=0,hover=false){
  const r=progress===null?sourceRegion(m):pageRegion(m,progress,box),fit=fitRect(r,box),nodes=[imageRegion(media(m,p,wireframe),r,box,{'data-app-page':true})];
  if(!wireframe&&hover&&m.hover&&frame>=8){
    const h=m.hover,inside=h.x>=r.x&&h.y>=r.y&&h.x+h.width<=r.x+r.width&&h.y+h.height<=r.y+r.height;
    if(inside){const lift=land(frame,8,4),b={x:fit.x+(h.x-r.x)*fit.scale,y:fit.y+(h.y-r.y)*fit.scale-lift*4,width:h.width*fit.scale,height:h.height*fit.scale};
      // Predict a hover lift using the observed component pixels. No new UI state.
      nodes.push(rect(b.x,b.y+4,b.width,b.height,p.theme.primary),imageRegion(media(m,p,false),h,b,{'data-predicted-hover':true}));
      nodes.push(cursor(b.x+b.width*.72+28*(1-lift),b.y+b.height*.65+20*(1-lift),.8,p));
    }
  }
  return {nodes,box:fit};
}
function opening(plan,frame,o){
  const p=plan.source,n=background(p),copy=wrap(p.description,p,44,720,2),top=270-copy.rows.length*copy.size/2;
  const open=land(frame,23,7),titleBox={x:90,y:236,width:780,height:59};
  if(frame<24){let word=0;copy.rows.forEach((row,i)=>{const x=(960-width(row,copy.size,p))/2;n.push(...words(row,x,top+i*copy.size,copy.size,p,frame,word*2));word+=row.split(/\s+/).length;});}
  if(frame>=22){const box={x:90,y:236+(52-236)*open,width:780,height:59+(426-59)*open};const screen=page(p.homepage,box,p,frame,o.wireframe);n.push(...screen.nodes,...markers(screen.box,p));}
  else n.push(...markers(titleBox,p));
  if(frame<27){const c=land(frame,12,9),pressed=frame===22?.85:1;n.push(cursor(775+(610-775)*c,346+(277-346)*c,pressed,p));}
  return n;
}
function homepage(plan,frame,o){const p=plan.source,n=background(p),scroll=frame<8?0:frame<21?.5*land(frame,8,8):.5+.5*land(frame,23,8),a=page(p.homepage,HOME,p,frame,o.wireframe,scroll,true);n.push(...a.nodes,...markers(a.box,p));return n;}
function feature(plan,id,frame,o){
  const p=plan.source,i=FOCUS_IDS.indexOf(id),f=plan.selected[i],n=[rect(0,0,960,540,surface(p))];
  const wm=wrap(f.name,p,301.529,1150,2);wm.rows.forEach((r,j)=>n.push(text(r,-89,25+j*233,wm.size,p,{opacity:.04})));
  const copy=wrap(f.title,p,44,630,1),y=87;
  n.push(...words(copy.rows[0],182,y,copy.size,p,frame,0));
  const m={...(f.page??f.media),label:f.name},offset=frame===0?17:frame===1?5:0,box={...FEATURE,y:FEATURE.y+offset};
  const screen=page(m,box,p,frame,o.wireframe,null,true);n.push(...screen.nodes);
  n.push(rect(screen.box.x+screen.box.width,screen.box.y-36,36,36,p.theme.ink),text(String(i+1).padStart(2,'0'),screen.box.x+screen.box.width+18,screen.box.y-25.4,14.294,p,{fill:p.theme.onPrimary,anchor:'middle'}));
  return n;
}
// Fixed Figma composition; source-derived independent paths are retargeted to
// these destinations. The central hovered feature stays the visual anchor.
const BUNDLE=[{x:371,y:161,width:218,height:218},{x:198,y:126,width:89,height:89},{x:652,y:410,width:89,height:89},{x:690,y:121,width:211,height:221},{x:137,y:-147,width:211,height:221},{x:-86,y:384,width:211,height:221},{x:125,y:295,width:89,height:89},{x:308,y:505,width:89,height:89},{x:641,y:74,width:47,height:47}];
function imagery(plan){return plan.source.images??[];}
function component(f){
  const r=f.media.hover??sourceRegion(f.media);
  // A very wide list row becomes an unreadable sliver in a square tile.
  // Use its supplied page instead; never squeeze or invent a narrower UI.
  if(r.width/r.height>3&&f.page)return {...f.page,label:f.name};
  return {...f.media,label:f.name,region:r};
}
function bundle(plan,frame,o){
  const p=plan.source,n=[rect(0,0,960,540,p.theme.accent),text(p.app.name,-598,3,230,p,{opacity:.04}),text(p.app.name,198,370,230,p,{opacity:.04})],pictures=imagery(plan);
  const roles=[component(plan.selected[0]),component(plan.selected[1]),component(plan.selected[2]),pictures[0],pictures[1],pictures[2],component(plan.selected[2]),component(plan.selected[1]),component(plan.selected[0])];
  for(const i of [4,5,8,1,6,7,2,3,0]){
    if(!roles[i])continue;let b={...BUNDLE[i]};
    if(i){const track=CARD_TRACKS[`card${i+1}`].samples,j=Math.min(25,Math.round(frame*25/18)),pose=track[j],home=track[25];if(!pose)continue;const s=pose[2]/home[2];b={x:b.x+(pose[0]-home[0])*.7,y:b.y+(pose[1]-home[1])*.7,width:b.width*s,height:b.height*s};}
    else {const s=frame<3?[.88,.98,1][frame]:1;b={x:b.x+(b.width-b.width*s)/2,y:b.y+(b.height-b.height*s)/2-4*land(frame,14,4),width:b.width*s,height:b.height*s};}
    const m=media({...roles[i],label:roles[i].label??plan.selected[i%3].name},p,o.wireframe,i),r=sourceRegion(m),f=fitRect(r,b);
    n.push(imageRegion(m,r,b,{'data-bundle-role':i>=3&&i<=5?'app-image':'feature'}));
    if(i===0){n.push(...markers(f,p));const a=land(frame,8,6);n.push(cursor(805+(f.x+f.width*.72-805)*a,270+(f.y+f.height*.6-270)*a,1,p));}
  }
  return n;
}
function capabilities(plan,frame,o){
  const p=plan.source,left=frame>=18,local=left?frame-18:frame,n=[rect(0,0,960,540,surface(p))];
  for(const [x,y]of [[-280,-75],[-63,159],[-701,408],[617,408]])n.push(text('Capabilities',x,y,230,p,{opacity:.04}));
  const copy=wrap(p.benefit??`Now you can ${plan.selected[0].title.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())}.`,p,64.719,433,3),x=left?480:112;
  copy.rows.forEach((r,i)=>n.push(text(r,x,243+i*57.785,copy.size,p,{'data-benefit':true})));
  const photos=imagery(plan),tiles=[component(plan.selected[0]),photos[0],photos[1],component(plan.selected[1]),component(plan.selected[2]),photos[2]],baseX=left?10:620;
  const track=REFERENCE_TRACKS['collage-file-strip'].translation,drift=track[Math.min(track.length-1,local*2)][0]*.12;
  for(let i=0;i<6;i++){if(!tiles[i])continue;const x=baseX+i%2*203,y=17+Math.floor(i/2)*214+drift,b={x,y,width:195,height:204},m=media({...tiles[i],label:tiles[i].label??plan.selected[i%3].name},p,o.wireframe,i);n.push(imageRegion(m,sourceRegion(m),b,{'data-capability-role':[1,2,5].includes(i)?'app-image':'feature'}));}
  for(const xx of left?[0,203,408]:[80,610,813])for(const yy of [221,435])n.push(rect(xx,yy,10,10,p.theme.ink));
  for(const xx of left?[0,203]:[610,813])n.push(rect(xx,7,10,10,p.theme.ink));
  return n;
}
function ending(plan,frame){
  const p=plan.source,n=[rect(0,0,960,540,p.theme.surface)];
  // Figma's two ending states: a brief row of native symbols, then the credit.
  if(frame<5){for(let i=0;i<7;i++){const height=i===1?28.796:i===5?27.102:i===6?25.067:23.714,width=i===5?27.102:i===6?25.006:23.714;n.push(el('image',{href:symbols[i],x:i===6?506.087:251+i*42,y:249+(23.714-height)/2,width,height,'data-symbol':i}));}}
  else {n.push(text('Proudly built on',251,241,33.602,p,{'data-credit':true}),el('image',{href:symbols[6],x:506.087,y:247,width:25.006,height:25.067}));}
  n.push(el('image',{href:logo,x:562,y:245,width:147,height:25.801,'aria-label':'Base44 official logo'}));
  return n;
}
export function renderFigmaFlow(id,frame,plan,options){
  const fn=FOCUS_IDS.includes(id)?()=>feature(plan,id,frame,options):({hook:opening,reveal:homepage,collage:bundle,capabilities,ending})[id];
  if(!fn)throw Error(`No Figma layout for ${id}`);
  return [group(fn(plan,frame,options),{'data-design-node':FIGMA_NODES[id].join(','),'data-design-revision':'2026-11-15'})];
}
