import {el,rect,text,group} from '../svg.js';
import {layer} from './element-render.js';
import {endcardPose} from './endcard-motion.js';
const asset=name=>new URL(`../../assets/v2/ending/${name}.svg`,import.meta.url).href;
const ink='#302f35',paper='#f2f1ed';
export const endcardAssets=['sentinel','knot','sprout','bloom','arrow','click','frame','B','a','s','e','4','mark','wordmark'].map(asset);
let ready;
export function preloadEndcard(){
  return ready??=(Promise.all(endcardAssets.map(src=>new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(Error('A Base44 ending asset could not load.'));img.src=src;
  }))).catch(error=>{ready=null;throw error;}));
}
// Fixed Base44 ending: the app palette cannot recolor this brand lockup.
export function renderEndcard(frame,motion,source){
  const pose=endcardPose(frame,motion.symbolFrames),n=[layer('background','Background',rect(0,0,960,540,paper))];
  if(pose.phase==='credit'){
    const p={theme:{ink},typography:source.typography};
    n.push(layer('credit','Proudly built on',text('Proudly built on',480,242,52,p,{anchor:'middle','data-credit':true}),{x:260,y:242,width:440,height:52}));
    return n;
  }
  const logoParts=[];
  pose.items.forEach((item,i)=>{
    const {x,y,width,height}=item,box={x,y,width,height};
    const attrs={href:asset(item.name),...box,'data-endcard-part':item.name,'data-source-frame':pose.sourceFrame};
    let node;
    if(item.lastFourGap){
      // Move only the last 4 for the source's single-frame kerning correction.
      const split=131*684/831;
      const segment=(left,w,dx)=>el('svg',{x:x+left+dx,y,width:w,height,viewBox:`${left} 0 ${w} ${height}`,overflow:'hidden'},[el('image',{href:asset('wordmark'),x:0,y:0,width,height})]);
      node=group([segment(0,split,0),segment(split,width-split,item.lastFourGap)],{'data-endcard-part':'wordmark','data-source-frame':pose.sourceFrame});
    }else node=el('image',{...attrs,...(item.kind==='symbol'?{'data-symbol':item.name}:{}),...(item.kind==='mark'?{'aria-label':'Base44 mark'}:{})});
    if(item.kind==='mark'||item.kind==='wordmark')logoParts.push(node);
    else n.push(layer(`symbol-${i}`,item.kind==='letter'?`Letter ${item.name}`:`Symbol · ${item.name}`,node,box));
  });
  if(logoParts.length)n.push(layer('logo','Base44 logo',logoParts,{x:392,y:253,width:176,height:36}));
  return n;
}
