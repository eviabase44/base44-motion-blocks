import {rect,text,el,fitRows} from '../svg.js';
import {endingTitleOffset} from '../motion.js';
const logo=new URL('../../assets/base44-logo.svg',import.meta.url).href;
const headline='Proudly built on';
export function renderEnding(frame,p) {
  const out=[rect(0,0,960,540,p.theme.surface)];
  const size=fitRows([[headline]],p,94,810,68),titleOffset=endingTitleOffset(frame,0);
  // Each line rises into a fixed mask, then holds. The camera and card stay still.
  if(titleOffset!==null)out.push(el('svg',{x:60,y:200,width:840,height:110,viewBox:'0 0 840 110',overflow:'hidden','data-ending-title':0},[
    text(headline,420,titleOffset,size,p,{anchor:'middle'})
  ]));
  const brandOffset=endingTitleOffset(frame,1);
  if(brandOffset!==null){
    const brandWidth=147,brandHeight=brandWidth*40/227.9;
    const left=(840-brandWidth)/2;
    out.push(el('svg',{x:60,y:304,width:840,height:110,viewBox:'0 0 840 110',overflow:'hidden','data-ending-title':1,'aria-label':'Base44'},[
      el('image',{href:logo,x:left,y:39+brandOffset,width:brandWidth,height:brandHeight,'aria-label':'Base44 symbol and wordmark'})
    ]));
  }
  return out;
}
