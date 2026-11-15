import {el,rect,text,group,width,cursor} from '../svg.js';
import {sourceRegion,fitRect} from './model.js';
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const out=t=>1-Math.pow(1-clamp(t),3);
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function imageRegion(media,region,box,attrs={}){
  const f=fitRect(region,box);
  if(media.wireframe)return group([rect(f.x,f.y,f.width,f.height,media.color??'#a9b8ee'),el('text',{x:f.x+f.width/2,y:f.y+f.height/2,'text-anchor':'middle','font-family':media.fontFamily??'Arial','font-size':Math.min(13,f.width/15),fill:'#172027'},[media.label??'APP SCREEN'])]);
  return el('svg',{x:f.x,y:f.y,width:f.width,height:f.height,viewBox:`${region.x} ${region.y} ${region.width} ${region.height}`,overflow:'hidden','data-media':media.src,...attrs},[
    el('image',{href:media.src,x:0,y:0,width:media.width,height:media.height,preserveAspectRatio:'none'})
  ]);
}
function lines(value,p,maxWidth,size,maxLines=3){
  let result;
  do{result=[];let line='';for(const word of value.split(/\s+/)){const next=line?line+' '+word:word;if(line&&width(next,size,p)>maxWidth){result.push(line);line=word;}else line=next;}if(line)result.push(line);if(result.length<=maxLines&&result.every(l=>width(l,size,p)<=maxWidth))return {rows:result,size};size-=2;}while(size>=26);
  throw Error('Shorten this title so it remains legible.');
}
function label(s,x,y,p,fill=p.theme.ink){return text(s,x,y,11,p,{fill,'letter-spacing':'.01em'});}
// Timing observed from the supplied 0:00–0:06 reference: gallery hold,
// cursor arrival/click, selected app expansion, then description assembly.
export function renderClickIn(plan,t,wireframe=false){
  if(wireframe){plan=structuredClone(plan);const decorate=(m,i)=>Object.assign(m,{wireframe:true,fontFamily:plan.source.typography.family,color:plan.source.theme.blocks?.[i]});decorate(plan.source.homepage,0);plan.selected.forEach((f,i)=>decorate(f.media,i));}
  const p=plan.source,seconds=t*6,r=sourceRegion(p.homepage);
  const click=1.76,open=out((seconds-1.92)/.5),nodes=[rect(0,0,960,540,mix(p.theme.surface,p.theme.ink,.08))];
  const galleryOpacity=1-ease((seconds-2.02)/.28);
  if(galleryOpacity>0){
    const gallery=[];
    for(const [i,m]of [plan.selected[1].media,p.homepage,plan.selected[2].media].entries()){
      const x=280+(i-1)*450,w=400+(i===1?open*110:0),h=w*r.height/r.width;
      gallery.push(imageRegion(m,sourceRegion(m),{x:x-(i===1?open*55:0),y:142-open*22,width:w,height:h}));
      gallery.push(rect(x,115,5,5,p.theme.ink),label(i===1?p.app.name:plan.selected[i===0?1:2].name,x+13,111,p));
    }
    const caption=lines(p.description,p,440,21,3);caption.rows.forEach((line,i)=>gallery.push(text(line,480,383+i*24,caption.size,p,{anchor:'middle'})));
    nodes.push(group(gallery,{opacity:galleryOpacity}));
    if(seconds>.7){const c=ease((seconds-.7)/.9),press=Math.sin(clamp((seconds-click)/.16)*Math.PI);nodes.push(cursor(688-94*c,463-148*c,2.2-press*.35,p));}
  }
  if(open>0){
    const x=90,y=52,w=780,h=426;
    const card=[rect(x,y,w,h,p.theme.surface),text(p.app.name,112,100,230,p,{opacity:.04}),text('/ 01',844,71,27,p,{anchor:'end'})];
    for(const yy of [68,264,462])card.push(el('circle',{cx:102,cy:yy,r:3.2,fill:p.theme.ink}));
    const copy=lines(p.description,p,369,44,4),start=2.52;
    copy.rows.forEach((row,i)=>{const e=out((seconds-start-i*.18)/.22);card.push(el('svg',{x:126,y:98+i*copy.size*1.02,width:374,height:copy.size*1.08,overflow:'hidden'},[text(row,0,(1-e)*copy.size,copy.size,p,{opacity:e,fill:seconds<start+i*.18+.4?p.theme.accent:p.theme.ink})]));});
    const reveal=ease((seconds-4.35)/.65),height=157+reveal*54;
    const visibleHeight=Math.min(r.height,height/318*r.width),region={...r,height:visibleHeight,y:r.y+(r.height-visibleHeight)*ease((seconds-4.6)/1.2)};
    card.push(imageRegion(p.homepage,region,{x:516,y:206,width:318,height}));
    card.push(label(p.app.name.toUpperCase(),516,178,p));
    card.push(rect(x,y+h-3,w*clamp((seconds-2.5)/3.5),3,p.theme.accent));
    const scale=.88+.12*open;nodes.push(group(card,{transform:`translate(480 265) scale(${scale}) translate(-480 -265)`,opacity:open}));
  }
  return nodes;
}
