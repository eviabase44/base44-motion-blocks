import {CARD_TRACKS} from '../data/collage.js';
import {rect,text,el,group,mediaSlot,cursor,width} from '../svg.js';
const order=[5,3,8,4,2,1,6,7,0];
export function renderCollage(frame,p,o) {
  const out=[rect(0,0,960,540,p.theme.surface)];
  for(const i of order) {
    const track=CARD_TRACKS[`card${i+1}`],box=track.samples[frame];if(!box)continue;
    const [x,y,w,h]=box,[cw,ch]=track.size,c=p.cards[i];
    const graphic=[3,4,6].includes(i),photoHeight=graphic?ch:ch*.68;
    const fill=graphic?(c.media.color??(i===3?p.theme.onPrimary:i===4?p.theme.accent:p.theme.primary)):p.theme.surface;
    const ink=i===6?p.theme.onPrimary:p.theme.ink;
    const parts=[rect(0,0,cw,ch,fill)];
    if(!graphic)parts.push(mediaSlot(c.media,0,0,cw,photoHeight,p,i,o.wireframe,cw*.065));
    const top=graphic?ch*.2:photoHeight+26,size=graphic?Math.min(92,cw*.15):cw*.061;
    const fitted=Math.min(size,(cw-50)/Math.max(1,width(c.title,size,p))*size);
    parts.push(text(c.title,24,top,fitted,p,{fill:ink,weight:i===6?p.typography.wordmarkWeight:p.typography.headlineWeight}));
    parts.push(text(c.subtitle,24,top+fitted+15,Math.min(21,cw*.031),p,{fill:ink,weight:p.typography.bodyWeight}));
    const layer=el('svg',{x,y,width:w,height:h,viewBox:`0 0 ${cw} ${ch}`,overflow:'hidden','data-card':i+1},parts);out.push(layer);
    if([0,1,2,4,8].includes(i))out.push(cursor(x+w*.84,y+h*.83,Math.max(.5,w/130),p));
  }
  return out;
}
