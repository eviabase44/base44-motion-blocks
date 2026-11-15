import {group} from '../svg.js';
import {elementSettings,elementTransform} from './element-settings.js';
export const layer=(id,label,nodes,bounds)=>group(Array.isArray(nodes)?nodes:[nodes],{'data-element-id':id,'data-element-label':label,'data-element-box':bounds?JSON.stringify({x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}):undefined});
export function applyElementEdits(svg,motion,shot){
  for(const node of svg.querySelectorAll('[data-element-id]')){
    const id=node.getAttribute('data-element-id'),saved=motion?.elements?.[shot]?.[id];
    if(!saved)continue;const s=elementSettings(motion,shot,id);
    node.setAttribute('transform',elementTransform(s));
    if(s.hidden)node.setAttribute('visibility','hidden');
  }
  return svg;
}
