import {rect,text,el,watermark,mediaSlot,fitRows,row} from '../svg.js';
import {revealImageY} from '../motion.js';
export function renderReveal(frame,p,o) {
  const out=[rect(0,0,960,540,p.theme.surface),watermark(p,-320,-95+(frame===0?52:frame===1?18:0),650)];
  for(const y of [13,274,526])out.push(el('circle',{cx:12,cy:y,r:5,fill:p.theme.ink}));
  // Another 15% enlargement; retain the bottom edge and give the headline room on the left.
  const landscape=p.showcase&&p.media.hero.width>p.media.hero.height;
  const screen=landscape?{x:390,y:258,width:530,height:267}:{x:450,y:141.6395,width:319.38375,height:383.2605},metaX=landscape?screen.x:screen.x+screen.width+19;
  out.push(mediaSlot(p.media.hero,screen.x,screen.y+revealImageY(frame),screen.width,screen.height,p,0,o.wireframe));
  const rows=[p.copy.reveal.slice(0,2),p.copy.reveal.slice(2,4),p.copy.reveal.slice(4)],size=fitRows(rows,p,64,690);
  const onsets=[2,3,5,6,8];let i=0;
  rows.forEach((values,r)=>row(values.map(value=>({value,index:i++})),61,43+r*64,size,p,(item,x,y)=>{
    const onset=onsets[item.index];if(frame>=onset)out.push(text(item.value,x,y+(frame<5?128:frame<8?64:0),size,p,{fill:frame-onset<=2?p.theme.accent:p.theme.ink}));
  }));
  if(frame>=1)out.push(text('/ 01',884,15+(frame<3?18:0),36,p));
  if(frame>=2)out.push(text(p.app.name,metaX,(landscape?screen.y-32:screen.y)+(frame<4?6:0),8,p));
  if(frame>=3)out.push(text(p.copy.category,metaX,(landscape?screen.y-32:screen.y)+14+(frame<5?6:0),8,p));
  return out;
}
