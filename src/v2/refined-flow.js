// Animation refinement of the user's Figma poses. This is native code motion,
// not an assertion that the source films or app interactions were recorded.
import {el,rect,text,group,width,cursor} from '../svg.js';
import {sourceRegion,fitRect,BEATS} from './model.js';
import {imageRegion} from './render.js';
import {settingsFor,motionFrame} from './motion-settings.js';
import {layer} from './element-render.js';
import {HOME,FEATURE,FOCUS_IDS,logo,symbols,surface,background,markers,media,wrap,component,imagery,BUNDLE,FIGMA_NODES,pageRegion} from './figma-flow.js';
import {clamp,lerp,phase,smoother,arrive,pulse,curvePoint} from './refined-motion.js';
import {capabilityCopy,capabilityLayout,connectorBoxes} from './capability-motion.js';
import {renderEndcard} from './endcard.js';

function pose(nodes,{x=0,y=0,opacity=1,scale=1,cx=0,cy=0}={}){return group(Array.isArray(nodes)?nodes:[nodes],{opacity,transform:`translate(${x} ${y}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`});}
// A local viewport masks the baseline while each word travels independently.
// The editable wrapper stays outside its authored animation transforms.
function typeLine(value,x,y,size,p,f,start,interval,softness,prefix='headline',travel=1){
  let offset=0;const count=value.trim().split(/\s+/).length,stagger=Math.min(interval,5/Math.max(1,count-1));
  return value.trim().split(/\s+/).map((word,i)=>{
    const w=width(word+' ',size,p),a=arrive(f,start+i*stagger,4.4,softness),node=text(word,0,0,size,p,{'data-type-word':i});
    const mask=el('svg',{x:x+offset-2,y:y-3,width:w+5,height:size*1.2+6,viewBox:`-2 -3 ${w+5} ${size*1.2+6}`,overflow:'hidden'},[pose(node,{y:(1-a)*size*.48*travel,opacity:phase(f,start+i*stagger,1.8)})]);
    offset+=w;return layer(`${prefix}-word-${i}`,`Word: ${word}`,mask,{x:x+offset-w,y,width:w,height:size*1.1});
  });
}
function screen(m,box,p,wireframe,progress=0,hover={}){
  const r=progress===null?sourceRegion(m):pageRegion(m,progress,box),fit=fitRect(r,box);
  const nodes=[layer('screen-image','App image',imageRegion(media(m,p,wireframe),r,box,{'data-app-page':true}),fit)];
  const h=m.hover;
  if(!wireframe&&h&&hover.visible>0&&h.x>=r.x&&h.y>=r.y&&h.x+h.width<=r.x+r.width&&h.y+h.height<=r.y+r.height){
    const b={x:fit.x+(h.x-r.x)*fit.scale,y:fit.y+(h.y-r.y)*fit.scale,width:h.width*fit.scale,height:h.height*fit.scale};
    const raised={...b,y:b.y-hover.lift};
    nodes.push(layer('hover-backing','Hover backing',rect(b.x,b.y,b.width,b.height,p.theme.primary,{opacity:hover.visible})),layer('hover-card','Hovered card',pose(imageRegion(media(m,p,false),h,raised,{'data-predicted-hover':true}),{opacity:hover.visible}),raised));
    const target={x:raised.x+raised.width*.72,y:raised.y+raised.height*.64},pos=curvePoint({x:target.x+55,y:target.y+35},{x:target.x+10,y:target.y+38},target,hover.approach??1);
    nodes.push(layer('hover-cursor','Hover cursor',pose(cursor(pos.x,pos.y,.8,p),{opacity:hover.cursorOpacity??hover.visible})));
  }
  return {nodes,box:fit};
}
function opening(plan,f,o){
  const p=plan.source,m=o.motion,n=background(p),copy=wrap(p.description,p,44,720,2),top=270-copy.rows.length*copy.size/2;
  const start=22.8,open=arrive(f,start,m.joinFrames,m.softness),titleExit=arrive(f,21.8,2.8,.2);
  let word=0;
  if(f<25){copy.rows.forEach((r,i)=>{const x=(960-width(r,copy.size,p))/2;n.push(layer(`headline-line-${i}`,`Title line ${i+1}`,pose(typeLine(r,x,top+i*copy.size,copy.size,p,f,word*m.wordFrames,m.wordFrames,m.softness,`line-${i}`,m.movement),{y:-7*titleExit,opacity:1-titleExit})));word+=r.split(/\s+/).length;});}
  const page=screen(p.homepage,HOME,p,o.wireframe,0),fit=page.box;
  // Reveal the already-sized page through a growing window. UI never stretches.
  const box={x:fit.x,y:lerp(242,fit.y,open),width:fit.width,height:lerp(46,fit.height,open)};
  if(f>=start){const clip=el('svg',{x:box.x,y:box.y,width:box.width,height:box.height,viewBox:`${box.x} ${box.y} ${box.width} ${box.height}`,overflow:'hidden'},page.nodes);n.push(layer('screen','App screen',pose(clip,{opacity:phase(f,start,1.2)}),box));}
  n.push(...markers(f>=start?box:{x:fit.x,y:236,width:fit.width,height:59},p));
  if(f<28){const pos=curvePoint({x:775,y:346},{x:718,y:262},{x:610,y:277},phase(f,12.4,7.4)),press=pulse(f,21,2.4),fade=1-phase(f,25,3);n.push(layer('cursor','Cursor',pose(cursor(pos.x,pos.y,1-.16*press,p),{opacity:phase(f,11.5,2)*fade})));}
  return n;
}
function homepage(plan,f,o){
  const p=plan.source,m=o.motion,n=background(p),progress=smoother(phase(f,5.4,14.2))*m.scroll;
  const hoverIn=arrive(f,24,4,m.softness),release=1-arrive(f,33,2,.5),visible=phase(f,20,1.5);
  const page=screen(p.homepage,HOME,p,o.wireframe,progress,{visible,lift:hoverIn*release*m.hover,approach:phase(f,20,4),cursorOpacity:visible*(1-phase(f,33,2))});
  n.push(layer('screen','App screen',page.nodes,page.box),...markers(page.box,p));return n;
}
function feature(plan,id,f,o){
  const p=plan.source,m=o.motion,i=FOCUS_IDS.indexOf(id),item=plan.selected[i],n=[layer('background','Background',rect(0,0,960,540,surface(p)))];
  const wm=wrap(item.name,p,301.529,1150,2);wm.rows.forEach((r,j)=>n.push(layer(`watermark-${j}`,`Watermark ${j+1}`,text(r,-89,25+j*233,wm.size,p,{opacity:.04}))));
  const copy=wrap(item.title,p,44,630,1);n.push(layer('headline','Feature title',typeLine(copy.rows[0],182,87,copy.size,p,f,.4,m.wordFrames,m.softness,'headline',m.movement)));
  const a=arrive(f,0,5.2,m.softness),box={...FEATURE,y:FEATURE.y+(i===0?14:0)*(1-a)*m.movement};
  const hoverIn=arrive(f,11,4,m.softness),hoverOut=1-arrive(f,20,3,.6),visible=phase(f,8,1.2);
  const page=screen({...item.page??item.media,label:item.name},box,p,o.wireframe,null,{visible,lift:m.hover*hoverIn*hoverOut,approach:phase(f,8,3),cursorOpacity:visible*(1-phase(f,19,4))});
  n.push(layer('screen','App screen',page.nodes,page.box));
  const num=i?1:arrive(f,1.8,4,.25),x=page.box.x+page.box.width,y=page.box.y-36;
  n.push(layer('number-box','Number block',pose(rect(x,y,36,36,p.theme.ink),{y:8*(1-num),opacity:num})),layer('number','Feature number',pose(text(String(i+1).padStart(2,'0'),x+18,y+10.6,14.294,p,{fill:p.theme.onPrimary,anchor:'middle'}),{y:8*(1-num),opacity:num})));
  return n;
}
function bundle(plan,f,o){
  const p=plan.source,m=o.motion,n=[layer('background','Background',rect(0,0,960,540,p.theme.accent)),layer('watermark-0','Watermark 1',text(p.app.name,-598,3,230,p,{opacity:.04})),layer('watermark-1','Watermark 2',text(p.app.name,198,370,230,p,{opacity:.04}))],pictures=imagery(plan);
  const roles=[component(plan.selected[0]),component(plan.selected[1]),component(plan.selected[2]),pictures[0],pictures[1],pictures[2],component(plan.selected[2]),component(plan.selected[1]),component(plan.selected[0])];
  const order=[4,5,8,1,6,7,2,3,0];
  for(const i of order){if(!roles[i])continue;const dest=BUNDLE[i],delay=i?(.5+(i%4)*.55):0,a=arrive(f,delay,i?10.2:6.3,m.softness);
    // A shallow clockwise fan follows the collage vocabulary. Peripheral cards
    // travel on tangent arcs, settle in depth order, then stop for readability.
    const cx=dest.x+dest.width/2,cy=dest.y+dest.height/2,dist=i?.23*(1-a)*m.movement:0,scale=i?1-.18*(1-a)*m.movement:1-.075*(1-a)*m.movement;
    const theta=i?-.28*(1-a)*m.movement:0,vx=(cx-480)*(1-dist),vy=(cy-270)*(1-dist),arcX=480+vx*Math.cos(theta)-vy*Math.sin(theta)-cx,arcY=270+vx*Math.sin(theta)+vy*Math.cos(theta)-cy;
    const hover=i===0?m.movement*3.5*arrive(f,15,4,.5):0;
    const b={x:dest.x+arcX+(dest.width-dest.width*scale)/2,y:dest.y+arcY+(dest.height-dest.height*scale)/2-hover,width:dest.width*scale,height:dest.height*scale};
    const item=media({...roles[i],label:roles[i].label??plan.selected[i%3].name},p,o.wireframe,i),r=sourceRegion(item),fit=fitRect(r,b);
    n.push(layer(`card-${i}`,`${i===0?'Center card':'Card '+(i+1)} · ${item.label}`,pose(imageRegion(item,r,b,{'data-bundle-role':i>=3&&i<=5?'app-image':'feature'}),{opacity:i?phase(f,delay,3):1}),fit));
    if(i===0){n.push(...markers(fit,p));const target={x:fit.x+fit.width*.72,y:fit.y+fit.height*.6},pos=curvePoint({x:805,y:330},{x:710,y:258},target,phase(f,9,6));n.push(layer('cursor','Cursor',pose(cursor(pos.x,pos.y,1,p),{opacity:phase(f,8,2)})));}
  }
  return n;
}
function capabilities(plan,f,o){
  const p=plan.source,m=o.motion,left=f>=18,local=left?f-18:f,n=[layer('background','Background',rect(0,0,960,540,surface(p)))];
  for(const [i,[x,y]]of [[-280,-75],[-63,159],[-701,408],[617,408]].entries())n.push(layer(`watermark-${i}`,`Watermark ${i+1}`,text('Capabilities',x,y,230,p,{opacity:.04})));
  // Crisp editorial exchange of the two supplied layouts, with lead and follow.
  // Unlike a cross-screen morph, the UI and headline never cross one another.
  const lead=!left?phase(f,16,2):0,copyX=left?480:112;
  const copy=wrap(capabilityCopy(plan,left),p,64.719,433,3);
  copy.rows.forEach((r,i)=>{const a=arrive(local,i*.65,4.6,m.softness);n.push(layer(`benefit-${i}`,`Benefit line ${i+1}`,pose(text(r,copyX,243+i*57.785,copy.size,p,{'data-benefit':true}),{y:(1-a)*13*m.movement-lead*4,opacity:.85+.15*a})));});
  const pictures=imagery(plan),tiles=[component(plan.selected[0]),pictures[0],pictures[1],component(plan.selected[1]),component(plan.selected[2]),pictures[2]],baseX=left?10:620;
  const boxes=capabilityLayout(tiles,f,baseX,m.movement),enter=arrive(f,0,6,m.softness);
  for(let i=0;i<6;i++){if(!tiles[i])continue;const b={...boxes[i],x:boxes[i].x+(left?-1:1)*(1-enter)*16*m.movement,y:boxes[i].y+(1-enter)*12*m.movement},item=media({...tiles[i],label:tiles[i].label??plan.selected[i%3].name},p,o.wireframe,i),fit=fitRect(sourceRegion(item),b);
    const grips=connectorBoxes(fit).map((g,j)=>rect(g.x,g.y,g.width,g.height,p.theme.ink,{'data-connector-for':`tile-${i}`,'data-connector-corner':j}));
    n.push(layer(`tile-${i}`,`Tile ${i+1} · ${item.label}`,[imageRegion(item,sourceRegion(item),b,{'data-capability-role':[1,2,5].includes(i)?'app-image':'feature'}),...grips],fit));
  }
  return n;
}
function ending(plan,f,o){return renderEndcard(f,o.motion,plan.source);}
export function renderRefinedFlow(id,rawFrame,plan,options){
  const motion=settingsFor(plan.source,id),last=BEATS.find(b=>b.id===id).frames-1,frame=motionFrame(rawFrame,last,motion.tempo),o={...options,motion};
  const fn=FOCUS_IDS.includes(id)?()=>feature(plan,id,frame,o):({hook:opening,reveal:homepage,collage:bundle,capabilities,ending})[id];
  return [group(fn(plan,frame,o),{'data-design-node':FIGMA_NODES[id].join(','),'data-design-revision':'2026-11-15','data-motion-style':'refined'})];
}
