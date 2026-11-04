import {rect,text,fitRows,row} from '../svg.js';
import {authoredOffset} from '../motion.js';
export function renderHook(frame,p) {
  const out=[rect(0,0,960,540,p.theme.primary)];
  const rows=[p.copy.hook.slice(0,2),p.copy.hook.slice(2,4),p.copy.hook.slice(4,6)];
  const size=fitRows(rows,p,83,650);const slots=[0,1,2,3,4,6],vectors=[[-101,0],[19,0],[-37,0],[0,0],[0,0],[0,23]];
  rows.forEach((values,r)=>row(values.map((value,i)=>({value,index:r*2+i})),262,119+r*89,size,p,(item,x,y)=>{
    const xy=authoredOffset(frame,slots[item.index],vectors[item.index]);
    if(xy)out.push(text(item.value,x+xy[0],y+xy[1],size,p,{fill:p.theme.onPrimary,'data-content':`copy.hook.${item.index}`}));
  }));return out;
}
