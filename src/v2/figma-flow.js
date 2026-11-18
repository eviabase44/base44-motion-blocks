// Native layers from fnmudHOvdfW16D6TjhEFz2, revised 2026-11-15.
// Static home poses are Figma's. Motion is a declared adaptation of measured
// Present Flow/SH22 paths, source-indexed pop/hold cadence and B44-06's glyph row.
import {el,rect,text,group,width,cursor} from '../svg.js';
import {CARD_TRACKS} from '../data/collage.js';
import {sourceRegion,fitRect,BEATS} from './model.js';
import {imageRegion} from './render.js';
import {settingsFor,motionFrame} from './motion-settings.js';
import {layer} from './element-render.js';
import {assetBundle,assetHome,anchorOnPage,assetScrollProgress,blendBox,bundleVisuals,bundlePose,BUNDLE_SLOTS} from './asset-bundle.js';
import {capabilityCopy,capabilityOffset,connectorBoxes} from './capability-motion.js';

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
function background(p,word=p.app.name){return [layer('background','Background',rect(0,0,960,540,surface(p))),layer('watermark','App watermark',text(word,-87,179,230,p,{opacity:.04}))];}
function markers(box,p,size=10){return [[box.x-size,box.y-size],[box.x+box.width,box.y-size],[box.x-size,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y],i)=>layer(`corner-${i}`,`Corner ${i+1}`,rect(x,y,size,size,p.theme.ink,{'data-corner':true})));}
function media(m,p,wireframe,index=0){return {...m,wireframe,color:m.color??p.theme.blocks?.[index%p.theme.blocks.length],fontFamily:p.typography.family,label:m.label??'APP SCREEN'};}
function wrap(value,p,size,maxWidth,maxLines,minSize=24){
  for(let s=size;s>=minSize;s-=1){const rows=[];let row='';for(const word of value.trim().split(/\s+/)){const next=row?row+' '+word:word;if(row&&width(next,s,p)>maxWidth){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);if(rows.length<=maxLines&&rows.every(r=>width(r,s,p)<=maxWidth))return {rows,size:s};}
  throw Error('Shorten the copy to keep this frame readable.');
}
function words(value,x,y,size,p,frame,start=0,interval=2,prefix='headline'){let offset=x;return value.split(/\s+/).map((word,i)=>{const w=width(word+' ',size,p),visible=frame>=start+i*interval;const n=text(word,offset,y,size,p,{opacity:visible?1:0,'data-type-word':i});offset+=w;return layer(`${prefix}-word-${i}`,`Word: ${word}`,n);});}
// Viewport dimensions follow the source, not a portrait template. A page can
// scroll only through pixels the host actually supplied.
export function pageRegion(m,progress,box=HOME){const r=sourceRegion(m);const h=Math.min(r.height,m.windowHeight??r.width*box.height/box.width);return {...r,height:h,y:r.y+(r.height-h)*clamp(progress)};}
function page(m,box,p,frame,wireframe,progress=0,hover=false,liftAmount=4){
  const r=progress===null?sourceRegion(m):pageRegion(m,progress,box),fit=fitRect(r,box),nodes=[layer('screen-image','App image',imageRegion(media(m,p,wireframe),r,box,{'data-app-page':true}),fit)];
  if(!wireframe&&hover&&m.hover&&frame>=8&&liftAmount>0){
    const h=m.hover,inside=h.x>=r.x&&h.y>=r.y&&h.x+h.width<=r.x+r.width&&h.y+h.height<=r.y+r.height;
    if(inside){const lift=land(frame,8,4),b={x:fit.x+(h.x-r.x)*fit.scale,y:fit.y+(h.y-r.y)*fit.scale-lift*liftAmount,width:h.width*fit.scale,height:h.height*fit.scale};
      // Predict a hover lift using the observed component pixels. No new UI state.
      nodes.push(layer('hover-backing','Hover backing',rect(b.x,b.y+liftAmount,b.width,b.height,p.theme.primary)),layer('hover-card','Hovered card',imageRegion(media(m,p,false),h,b,{'data-predicted-hover':true}),b));
      nodes.push(layer('hover-cursor','Hover cursor',cursor(b.x+b.width*.72+28*(1-lift),b.y+b.height*.65+20*(1-lift),.8,p)));
    }
  }
  return {nodes,box:fit};
}
function opening(plan,frame,o){
  const p=plan.source,n=background(p),copy=wrap(p.description,p,44,720,2),top=270-copy.rows.length*copy.size/2;
  const open=land(frame,23,o.motion.joinFrames),titleBox={x:90,y:236,width:780,height:59};
  if(frame<24){let word=0;copy.rows.forEach((row,i)=>{const x=(960-width(row,copy.size,p))/2;n.push(layer(`headline-line-${i}`,`Title line ${i+1}`,words(row,x,top+i*copy.size,copy.size,p,frame,word*o.motion.wordFrames,o.motion.wordFrames,`line-${i}`)));word+=row.split(/\s+/).length;});}
  if(frame>=22){const box={x:90,y:236+(52-236)*open,width:780,height:59+(426-59)*open};const screen=page(p.homepage,box,p,frame,o.wireframe);n.push(layer('screen','App screen',screen.nodes,screen.box),...markers(screen.box,p));}
  else n.push(...markers(titleBox,p));
  if(frame<27){const c=land(frame,12,9),pressed=frame===22?.85:1;n.push(layer('cursor','Cursor',cursor(775+(610-775)*c,346+(277-346)*c,pressed,p)));}
  return n;
}
// Two scroll pushes, then a deliberate click and a six-frame isolation move.
// The last source-page frame and first bundle frame share the very same asset.
export function homepagePose(plan,frame,motion){
  const p=plan.source,b=assetBundle(plan),r0=pageRegion(p.homepage,0),end=assetScrollProgress(p.homepage,b,motion.scroll,r0.height);
  const progress=(frame<17?.46*land(frame,3,13):.46+.54*land(frame,18,11))*end;
  const region=pageRegion(p.homepage,progress),anchor=anchorOnPage(b.anchor,region,HOME),home=assetHome(b.media);
  const box=anchor?blendBox(fitRect(sourceRegion(b.media),anchor),home,land(frame,34,6)):home;
  return {bundle:b,progress,anchor,box,isolating:frame>=34&&Boolean(anchor)};
}
function homepage(plan,frame,o){
  const p=plan.source,n=background(p),pose=homepagePose(plan,frame,o.motion);
  if(frame<36||!pose.anchor){const a=page(p.homepage,HOME,p,frame,o.wireframe,pose.progress);n.push(layer('screen','App screen',a.nodes,a.box),...markers(a.box,p));}
  if(pose.anchor&&frame>=30){
    const b=pose.box,m=media(pose.bundle.media,p,o.wireframe);
    // No rectangular backing: keep the measured source silhouette and content.
    n.push(layer('selected-asset',pose.bundle.label,imageRegion(m,sourceRegion(m),b,{'data-clicked-asset':pose.bundle.assetId}),b));
    if(frame>=36)n.push(...markers(b,p));
    const a=land(frame,30,2),press=frame===33?.78:1;
    n.push(layer('cursor','Cursor',cursor(b.x+b.width*.72+38*(1-a),b.y+b.height*.62+25*(1-a),press,p)));
  }
  return n;
}
function feature(plan,id,frame,o){
  const p=plan.source,i=FOCUS_IDS.indexOf(id),f=plan.selected[i],n=[layer('background','Background',rect(0,0,960,540,surface(p)))];
  const wm=wrap(f.name,p,301.529,1150,2);
  // Large type travels behind the held UI on separate, offset keys. Direction
  // alternates per feature; arrival is quick, followed by a slow lateral drift.
  wm.rows.forEach((r,j)=>{const dir=i%2?-1:1,enter=land(frame,j*2,7),drift=clamp((frame-9)/14),dx=dir*((1-enter)*320-drift*48)*o.motion.backgroundMotion,dy=(1-enter)*36*o.motion.backgroundMotion;
    n.push(layer(`watermark-${j}`,`Watermark ${j+1}`,text(r,-89+dx,25+j*233+dy,wm.size,p,{opacity:.04,'data-background-motion':true})));});
  const copy=wrap(f.title,p,44,630,1),y=87;
  n.push(layer('headline','Feature title',words(copy.rows[0],182,y,copy.size,p,frame,0,o.motion.wordFrames)));
  const m={...(f.page??f.media),label:f.name},offset=frame<1?17:frame<2?5:0,box={...FEATURE,y:FEATURE.y+offset};
  const screen=page(m,box,p,frame,o.wireframe,null,true,o.motion.hover);n.push(layer('screen','App screen',screen.nodes,screen.box));
  n.push(layer('number-box','Number block',rect(screen.box.x+screen.box.width,screen.box.y-36,36,36,p.theme.ink)),layer('number','Feature number',text(String(i+1).padStart(2,'0'),screen.box.x+screen.box.width+18,screen.box.y-25.4,14.294,p,{fill:p.theme.onPrimary,anchor:'middle'})));
  return n;
}
// Original destinations retained for the archived smooth experiment.
// The active bundle uses the four readable BUNDLE_SLOTS in asset-bundle.js.
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
  const p=plan.source,bundle=assetBundle(plan),n=[layer('background','Background',rect(0,0,960,540,p.theme.accent)),layer('watermark-0','Watermark 1',text(p.app.name,-598,3,230,p,{opacity:.04})),layer('watermark-1','Watermark 2',text(p.app.name,198,370,230,p,{opacity:.04}))];
  // Host-selected feature fragments or contextual imagery; never fill gaps
  // with disconnected facts, tiny cutouts or arbitrary gallery neighbours.
  bundleVisuals(bundle).forEach((item,k)=>{
    const base=BUNDLE_SLOTS[k],i=base.id,track=CARD_TRACKS[`card${i+1}`].samples,j=Math.min(25,Math.round(frame*25/11)),pose=track[j],home=track[25];if(!pose)return;
    const b=bundlePose(base,pose,home,o.motion.movement);
    if(!b.width)return;
    const m=media({...item.media,label:item.label},p,o.wireframe,i),r=sourceRegion(m),box=fitRect(r,b);
    const node=imageRegion(m,r,b,{'data-bundle-item':item.id,'data-bundle-role':item.role??(item.featureId?'feature':'mood'),'data-related-asset':item.assetId,'data-related-feature':item.featureId});
    n.push(layer(`card-${i}`,item.label,node,box));
  });
  const m=media({...bundle.media,label:bundle.label},p,o.wireframe),b=assetHome(m);
  n.push(layer('card-0',`Center card · ${bundle.label}`,imageRegion(m,sourceRegion(m),b,{'data-clicked-asset':bundle.assetId}),b),...markers(b,p));
  if(frame<4)n.push(layer('cursor','Cursor',cursor(b.x+b.width*.72,b.y+b.height*.62,1,p)));
  return n;
}
function capabilities(plan,frame,o){
  const p=plan.source,left=frame>=18,n=[layer('background','Background',rect(0,0,960,540,surface(p)))];
  for(const [i,[x,y]]of [[-280,-75],[-63,159],[-701,408],[617,408]].entries())n.push(layer(`watermark-${i}`,`Watermark ${i+1}`,text('Capabilities',x,y,230,p,{opacity:.04})));
  const copy=wrap(capabilityCopy(plan,left),p,64.719,433,3),x=left?480:112;
  copy.rows.forEach((r,i)=>n.push(layer(`benefit-${i}`,`Benefit line ${i+1}`,text(r,x,243+i*57.785,copy.size,p,{'data-benefit':true}))));
  const photos=imagery(plan),tiles=[component(plan.selected[0]),photos[0],photos[1],component(plan.selected[1]),component(plan.selected[2]),photos[2]],baseX=left?10:620;
  for(let i=0;i<6;i++){
    if(!tiles[i])continue;
    const x=baseX+i%2*203,y=17+Math.floor(i/2)*214+capabilityOffset(frame,i%2,o.motion.movement),b={x,y,width:195,height:204};
    const m=media({...tiles[i],label:tiles[i].label??plan.selected[i%3].name},p,o.wireframe,i),fit=fitRect(sourceRegion(m),b);
    // The image and its four grips are one editable layer. Dragging/resizing a
    // grip therefore adjusts the image, and saved tweaks keep them connected.
    const grips=connectorBoxes(fit).map((g,j)=>rect(g.x,g.y,g.width,g.height,p.theme.ink,{'data-connector-for':`tile-${i}`,'data-connector-corner':j}));
    n.push(layer(`tile-${i}`,`Tile ${i+1} · ${m.label}`,[imageRegion(m,sourceRegion(m),b,{'data-capability-role':[1,2,5].includes(i)?'app-image':'feature'}),...grips],fit));
  }
  return n;
}
function ending(plan,frame,o){
  const p=plan.source,n=[layer('background','Background',rect(0,0,960,540,p.theme.surface))];
  // B44-06 F1200–1206 uses held glyph substitutions, not a row fade.
  // Adapt its 3/1/3 native-frame holds to these seven Figma symbols at 12 fps.
  if(frame<o.motion.symbolFrames){
    const native=Math.floor(frame/Math.max(1,o.motion.symbolFrames-1)*6),key=native<3?0:native<4?1:2,orders=[[0,1,2,3,4,5,6],[3,0,5,2,6,1,4],[5,3,1,0,2,4,6]],order=orders[key];
    for(let i=0;i<7;i++){const symbol=order[i],height=symbol===1?28.796:symbol===5?27.102:symbol===6?25.067:23.714,w=symbol===5?27.102:symbol===6?25.006:23.714;
      n.push(layer(`symbol-${i}`,`Symbol ${i+1}`,el('image',{href:symbols[symbol],x:(i===6?506.087:251+i*42)+(23.714-w)/2,y:249+(23.714-height)/2,width:w,height,'data-symbol':symbol,'data-symbol-key':key})));}
  }
  else {n.push(layer('credit','Proudly built on',text('Proudly built on',251,241,33.602,p,{'data-credit':true})),layer('symbol-6','Arrow',el('image',{href:symbols[6],x:506.087,y:247,width:25.006,height:25.067})));}
  n.push(layer('logo','Base44 logo',el('image',{href:logo,x:562,y:245,width:147,height:25.801,'aria-label':'Base44 official logo'})));
  return n;
}
export function renderFigmaFlow(id,rawFrame,plan,options){
  const motion=settingsFor(plan.source,id),last=BEATS.find(s=>s.id===id).frames-1,frame=motionFrame(rawFrame,last,motion.tempo);options={...options,motion};
  const fn=FOCUS_IDS.includes(id)?()=>feature(plan,id,frame,options):({hook:opening,reveal:homepage,collage:bundle,capabilities,ending})[id];
  if(!fn)throw Error(`No Figma layout for ${id}`);
  return [group(fn(plan,frame,options),{'data-design-node':FIGMA_NODES[id].join(','),'data-design-revision':'2026-11-15'})];
}

// Shared layout geometry for the archived smooth experiment.
export {HOME,FEATURE,FOCUS_IDS,logo,symbols,surface,background,markers,media,wrap,component,imagery,BUNDLE};
