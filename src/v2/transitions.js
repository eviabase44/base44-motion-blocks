import {el,group} from '../svg.js';
import {settingsFor} from './motion-settings.js';
export function cutFor(payload,from){return settingsFor(payload.showcase??{},from);}
export function compositeCut(outgoing,incoming,type,progress){
  const t=Math.max(0,Math.min(1,progress));
  if(type==='cut'||t>=1)return incoming;
  const a=group([...outgoing.children],{'data-cut-side':'outgoing'}),b=group([...incoming.children],{'data-cut-side':'incoming'});
  incoming.replaceChildren();incoming.setAttribute('data-cut-type',type);incoming.setAttribute('data-cut-progress',t);
  if(type==='dissolve'){b.setAttribute('opacity',t);incoming.append(a,b);}
  else if(type==='slide-left'||type==='slide-right'){const direction=type==='slide-left'?-1:1;a.setAttribute('transform',`translate(${direction*960*t} 0)`);b.setAttribute('transform',`translate(${-direction*960*(1-t)} 0)`);incoming.append(a,b);}
  else if(type==='wipe'){incoming.append(a);if(t>0)incoming.append(el('svg',{width:960*t,height:540,viewBox:`0 0 ${960*t} 540`,overflow:'hidden'},[b]));}
  return incoming;
}
