import {rect,text,el,group,width,mediaSlot,row} from '../svg.js';
import {featureScroll} from '../motion.js';
import {getFeatureMedia} from '../contracts.js';
import {sourceLocalFrame} from '../variants.js';
import {REFERENCE_TRACKS} from '../data/reference-tracks.js';

// Base coordinates follow source measurements at 960 × 540, with recorded user layout revisions. Native 24 fps poses
// are sampled at 12 fps without entrance retiming; short shots end in a hold.
const fit=(value,size,max,p)=>Math.min(size,size*max/Math.max(1,width(value,size,p)));
const headlineFit=(value,size,max,p,min=26)=>{const fitted=fit(value,size,max,p);if(fitted<min)throw new Error('Shorten copy for this source composition.');return fitted;};
const label=(value,x,y,max,p,fill=p.theme.ink,size=10)=>text(value,x,y,fit(value,size,max,p),p,{fill});
const decorative=nodes=>group(nodes,{'data-decorative':'true','aria-hidden':'true'});
const sample=(key,property,f)=>{const values=REFERENCE_TRACKS[key][property];return values[Math.min(f,values.length-1)];};
const ghost=(p,value,x,y,size,opacity=.045)=>decorative([text(value,x,y,size,p,{opacity})]);
let textureId=0;
function paper(p,f,blue=false,background=null){
  const id=`source-paper-${++textureId}`,seed=1+Math.floor(f/6)%3;
  return [rect(0,0,960,540,background??(blue?p.theme.primary:p.theme.surface)),el('defs',{},[
    el('filter',{id,x:0,y:0,width:'100%',height:'100%'},[
      el('feTurbulence',{type:'fractalNoise',baseFrequency:.82,numOctaves:3,seed,stitchTiles:'stitch'}),
      el('feColorMatrix',{type:'saturate',values:0})
    ])]),rect(0,0,960,540,p.theme.ink,{filter:`url(#${id})`,opacity:blue?.065:.035,'data-decorative':'texture'})];
}
function timedRow(values,onsets,x,y,size,p,f,{fill=p.theme.ink,flash=false,offsets=[]}={}){
  const out=[];row(values.map((value,i)=>({value,i})),x,y,size,p,(item,tx,ty)=>{
    const age=f-onsets[item.i];if(age<0)return;
    const offset=offsets[item.i]??[0,0,0];
    out.push(text(item.value,tx+(age<offset[2]?offset[0]:0),ty+(age<offset[2]?offset[1]:0),size,p,{fill:flash&&age<2?p.theme.accent:fill,'data-content':'copy'}));
  });return out;
}
function hook(frame,p,o){
  const f=sourceLocalFrame('hook',o.variant,frame),words=p.copy.hook;
  if(o.variant==='agency-line'){
    const out=paper(p,f),values=[words[0],words[1],words.slice(2,4).join(' '),words.slice(4).join(' ')];
    const size=headlineFit(words.join(' '),42,670,p),scale=f>=36?.9375:f>=34?.96875:1;
    if(f>=32)out.push(decorative(Array.from({length:13},(_,i)=>el('path',{d:`M${i*80} 0V540`,stroke:p.theme.ink,'stroke-opacity':.025,'stroke-width':.5}))));
    const lineX=(960-width(words.join(' '),size,p))/2;
    out.push(group(timedRow(values,[0,5,13,18],lineX,247,size,p,f,{offsets:[[0,0,0],[0,0,0],[0,18.5,3],[55,0,5]]}),{transform:`translate(480 270) scale(${scale}) translate(-480 -270)`,'data-centered-line':'agency'}));
    return out;
  }
  if(o.variant==='dark-statement'){
    const out=paper(p,f,false,p.theme.ink),rows=[words.slice(0,4),words.slice(4)],fill=p.theme.surface;
    const size=Math.min(80,headlineFit(rows[0].join(' '),80,580,p,34),headlineFit(rows[1].join(' '),80,420,p,34));
    const capY=f<13?235:f<14?221:f<16?203:191.5,y=capY-size*.145;
    out.push(rect(96.5,260,15,15,fill));if(f>=14)out.push(rect(847.5,260,15,15,fill));
    const firstX=(960-width(rows[0].join(' '),size,p))/2;
    out.push(group(timedRow([rows[0][0],rows[0].slice(1).join(' ')],[0,4],firstX,y,size,p,f,{fill,flash:true,offsets:[[-8,0,2]]}),{'data-centered-line':'statement-first'}));
    if(f>=13)out.push(text(rows[1].join(' '),480,274-size*.145,size,p,{anchor:'middle',fill:f<15?p.theme.primary:fill,'data-centered-line':'statement-second'}));
    return out;
  }
  // B44-05 / shot 31. Completed type becomes a cropped ghost; the next
  // app benefit occupies the same three-row active block as the source.
  const out=paper(p,f);out.push(ghost(p,p.app.name.toUpperCase(),-25,-110,650,.025));
  [30,270,510].forEach(y=>out.push(el('circle',{cx:26,cy:y,r:2.4,fill:p.theme.ink})));
  out.push(mediaSlot(p.media.hero,225.5,184.35,130,144.3,p,0,o.wireframe,7));
  const rows=[words.slice(0,2),words.slice(2,4),words.slice(4)],next=[p.copy.reveal.slice(0,2).join(' '),p.copy.reveal.slice(2,4).join(' '),p.copy.reveal[4]];
  const size=Math.min(82,...rows.map(v=>headlineFit(v.join(' '),82,555,p,44)),...next.map(v=>headlineFit(v,82,555,p,44)));
  const y=f>=41?-40:f>=30?105:198,first=[];
  rows.forEach((v,i)=>first.push(...timedRow(v,[[0,6],[11,17],[23,39]][i],367,y+i*80,size,p,f,{flash:true})));
  out.push(f>=41?decorative([group(first,{opacity:.16})]):group(first));
  if(f>=30){const ny=f>=41?198:f>=35?351:f>=31?431.5:456.5;
    const nodes=next.map((v,i)=>text(v,367,ny+i*80,size,p,{opacity:f>=41?1:.16,fill:i===2&&f>=46&&f<49?p.theme.accent:p.theme.ink}));
    out.push(f<41?decorative(nodes):group(nodes));
  }return out;
}

function reveal(frame,p,o){
  const key=`reveal-${o.variant}`,f=sourceLocalFrame('reveal',o.variant,frame),out=paper(p,f),[x,y,w,h]=sample(key,'window',f);
  out.push(mediaSlot(p.media.hero,x,y,w,h,p,0,o.wireframe));
  if(o.variant==='screen-stage'){
    if(f>=11&&!p.showcase)out.push(rect(x,y,w,h,p.theme.accent,{opacity:[.08,.14,.22,.29,.35,.4][Math.min(5,f-11)]}));
    const spread=f>=15?14:0;
    [[153.5-spread,52.5-spread],[806.5+spread,52.5-spread],[153.5-spread,507.5+spread],[806.5+spread,507.5+spread]].forEach(([cx,cy])=>out.push(el('circle',{cx,cy,r:5,fill:p.theme.primary})));
    return out;
  }
  out.push(rect(x,y-17,4,4,p.theme.ink),label(`${p.app.name} · ${p.copy.category}`,x+10,y-20,w-10,p,p.theme.ink,7));
  const left=o.variant==='echo-left';
  const breaks=[1,2,3,4].map(i=>{const lines=[p.copy.reveal.slice(0,i).join(' '),p.copy.reveal.slice(i).join(' ')];return {lines,size:Math.min(42,fit(lines[0],42,left?315:425,p),fit(lines[1],42,left?230:330,p))};}).sort((a,b)=>b.size-a.size);
  const {lines,size}=breaks[0];if(size<24)throw new Error('Shorten copy for this source composition.');
  const tx=left?(f<3?588:607.5):120,secondX=left?717.5:220;
  if(!left){
    if(f<31)out.push(decorative(lines.map((v,i)=>text(v,555+i*100,-22+i*38,size,p,{opacity:.055}))));
    if(f<32)out.push(decorative(lines.map((v,i)=>text(v,-201+i*100,209+i*38,size,p,{opacity:.055}))));
    out.push(decorative(lines.map((v,i)=>text(v,598+i*100,493+i*38,size,p,{opacity:.035}))));
  }
  out.push(text(lines[0],tx,198,size,p));
  if(f>=(left?14:6))out.push(text(lines[1],secondX,236,size,p));
  const iconOn=left?14:13;
  if(f>=iconOn){const n=f-iconOn,s=n<2?3:n<4?9:20,ix=left?727:474;
    out.push(rect(ix-s/2,280,s,s,p.theme.primary));
  }return out;
}

// Source-cropped fragment bounds are deliberate. Labels remain clipped to their
// individual media block, never spill into the typography's clear central area.
function block(p,o,index,box,{caption=false}={}){
  const [x,y,w,h]=box,c=p.cards[index%p.cards.length],nodes=[];
  const cap=caption?Math.min(52,h*.24):0;
  nodes.push(mediaSlot(c.media,0,0,w,h-cap,p,index,o.wireframe,Math.min(12,w/17)));
  if(caption)nodes.push(rect(0,h-cap,w,cap,p.theme.surface),label(c.title,8,h-cap+7,w-16,p,p.theme.ink,12),label(c.subtitle,8,h-cap+24,w-16,p,p.theme.ink,8));
  return el('svg',{x,y,width:w,height:h,viewBox:`0 0 ${w} ${h}`,overflow:'hidden','data-card':index+1,'data-source-crop':x<0||y<0||x+w>960||y+h>540?'true':undefined},nodes);
}
function collage(frame,p,o){
  const f=sourceLocalFrame('collage',o.variant,frame),out=paper(p,f);
  if(o.variant==='fragment-field'){
    const boxes=[[574,-28,335,211],[98,-47,334,210],[309,-14,209,115],[-42,44,202,202],[22,340,307,300],[309,458,152,152],[545,350,200,152],[718,390,300,200],[818,168,70,70]],onsets=[0,2,2,4,5,6,7,8,10];
    boxes.forEach((box,i)=>{if(f>=onsets[i])out.push(block(p,o,i,box));});
    const title=p.app.name,parts=title.split(' '),size=fit(title,52,480,p),x=(960-width(title,size,p))/2;
    out.push(...timedRow(parts,parts.map((_,i)=>[0,3,9][Math.min(i,2)]),x,249,size,p,f,{flash:true}));
    return out;
  }
  if(o.variant==='file-strip'){
    const [dx,dy]=sample('collage-file-strip','translation',f);
    out.push(label(`${p.app.name} / FILES`,20,18,800,p,p.theme.ink,9));
    const boxes=[[-100,141,171,108],[84,78,186,289],[283,92,175,218],[471,91,429,289],[912,127,190,167],[1115,100,200,300]];
    out.push(group(boxes.map((b,i)=>block(p,o,i,[b[0]+dx,b[1]+dy,b[2],b[3]],{caption:i===1||i===4}))));
    return out;
  }
  const boxes=[[42,-12,176,176],[768,36,172,112],[20,240,150,176],[205,424,238,158],[762,342,160,100],[267,45,184,120],[395,-15,282,223],[450,370,210,175],[580,400,218,110]],onsets=[0,0,2,0,5,9,13,7,7];
  const echo=f>=19,count=echo?(f<22?2:3):1;
  boxes.forEach((b,i)=>{if(f<onsets[i])return;for(let n=0;n<count;n++)out.push(block(p,o,i,[b[0]+n*90,b[1],b[2],b[3]]));});
  const title=p.app.name,size=fit(title,64,310,p),tx=echo?620:260;
  if(echo)out.push(decorative([text(title,tx-180,250,size,p,{opacity:.15}),text(title,tx-90,250,size,p,{opacity:.35})]));
  out.push(text(title,tx,250,size,p));return out;
}

function featureGallery(frame,p,o,box){
  const [x,y,w,h]=box,images=getFeatureMedia(p),scroll=featureScroll(frame,images.length);
  return el('svg',{x,y,width:w,height:h,viewBox:`0 0 ${w} ${h}`,overflow:'hidden','data-feature-gallery':'','data-scroll-index':scroll},[
    group(images.map((m,i)=>group([mediaSlot(m,0,i*h,w,h,p,i+1,o.wireframe,Math.min(12,w/17))],{'data-feature-index':i})),{transform:`translate(0 ${-scroll*h})`})
  ]);
}
function focus(frame,p,o){
  const key=`focus-${o.variant}`,f=sourceLocalFrame('focus',o.variant,frame),out=paper(p,f,true),ink=p.theme.onPrimary,words=p.copy.focus;
  const box=sample(key,'window',f),[x,y,w]=box;
  out.push(ghost(p,p.app.name.toUpperCase(),-45,-70,610,.035));
  if(o.variant==='diagonal-window'){
    const size=Math.min(50,...words.map(v=>headlineFit(v,50,260,p)));
    [[0,47,37,3],[1,47,96,10],[2,665,424,22],[3,665,478,28]].forEach(([i,tx,ty,start])=>{if(f>=start)out.push(text(words[i],tx,ty,size,p,{fill:ink}));});
    out.push(el('circle',{cx:x,cy:y-11,r:2.5,fill:f<6?ink:p.theme.accent}),label(p.app.name,x+8,y-17,w-8,p,ink,7));
    [p.app.name,p.copy.category,p.copy.detail].forEach((v,i)=>out.push(label(v,47,489+i*11,360,p,ink,7)));
  }else{
    const right=o.variant==='six-week',tx=right?178:560,tx2=right?308:670;
    const size=Math.min(50,headlineFit(words.slice(0,2).join(' '),50,right?330:320,p),headlineFit(words.slice(2).join(' '),50,right?208:265,p));
    out.push(label(p.app.name,15,13,350,p,ink,12));
    if(right)out.push(rect(896,26,10,10,ink),rect(54,504,10,10,ink));
    else out.push(rect(25,26,10,10,ink),rect(923,504,10,10,ink));
    const first=f<3?words[0].slice(0,Math.max(1,Math.ceil(words[0].length/2))):words[0];
    out.push(...timedRow([first,words[1]],[0,right?6:7],tx,224,size,p,f,{fill:ink}));
    if(right){
      if(f>=11)out.push(text(f<14?words.slice(2).join(' ').slice(0,3):words.slice(2).join(' '),tx2,267,size,p,{fill:ink}));
    }else{
      if(f>=12){let line=words[2];if(f>=18)line+=' '+(f<21?words[3].slice(0,2):words[3]);out.push(text(line,tx2,267,size,p,{fill:ink}));}
      if(f>=22)out.push(rect(tx2,322,width(words.slice(2).join(' '),size,p),2,ink));
    }
  }
  out.push(featureGallery(frame,p,o,box));return out;
}
export const variantRenderers={hook,reveal,collage,focus};
