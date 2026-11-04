import {rect,text,watermark,mediaSlot,fitRows,width,el,group} from '../svg.js';
import {featureScroll} from '../motion.js';
import {getFeatureMedia} from '../contracts.js';
export function renderFocus(frame,p,o) {
  const out=[rect(0,0,960,540,p.theme.primary)];
  if(frame>=6)out.push(watermark(p,-70,125,260,.055));
  for(const x of [140,806]){out.push(rect(x,0,11,11,p.theme.ink));out.push(rect(x,530,11,10,p.theme.ink));}
  const words=p.copy.focus,size=fitRows([[words[0]],[words[1],words[2]],[words[3]]],p,88,650,68);
  const coords=[[270,24],[270,354],[270+width(words[1]+' ',size,p),354],[270,440]];
  const onsets=[9,10,11,13],accents=[2,2,3,2];
  words.forEach((word,i)=>{if(frame>=onsets[i])out.push(text(word,coords[i][0]+(frame-onsets[i]<2?23.65:0),coords[i][1],size,p,{fill:frame-onsets[i]<accents[i]?p.theme.accent:p.theme.onPrimary}));});
  if(frame>=9)out.push(text('/ 03',244+(frame<12?22:frame<13?8:0),207,36,p,{fill:p.theme.onPrimary}));
  // A 10% smaller, fixed window gives the headline space while three app images scroll inside it.
  const window={x:345.18,y:145.13,width:269.64,height:200.34};
  if(frame>=11){
    const images=getFeatureMedia(p),scroll=featureScroll(frame,images.length);
    const slides=images.map((image,i)=>group([mediaSlot(image,0,i*window.height,window.width,window.height,p,i+1,o.wireframe)],{'data-feature-index':i}));
    out.push(el('svg',{x:window.x+(frame<14?22:frame<15?8:0),y:window.y,width:window.width,height:window.height,viewBox:`0 0 ${window.width} ${window.height}`,overflow:'hidden','data-feature-gallery':'','data-scroll-index':scroll},[group(slides,{transform:`translate(0 ${-scroll*window.height})`})]));
  }
  if(frame>=13)out.push(text(p.copy.detail,window.x,128.13,9,p,{fill:p.theme.onPrimary}));
  return out;
}
