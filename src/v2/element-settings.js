export const ELEMENT_DEFAULTS=Object.freeze({dx:0,dy:0,sx:1,sy:1,px:0,py:0,hidden:false});
const shotIds=new Set(['hook','reveal','collage','focus','focus2','focus3','capabilities','ending']);
export function validateElements(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid element adjustments.');
  const result={};
  for(const [shot,layers]of Object.entries(input)){
    if(!shotIds.has(shot)||!layers||typeof layers!=='object'||Array.isArray(layers)||Object.keys(layers).length>256)throw Error('Invalid element shot.');
    result[shot]={};
    for(const [id,values]of Object.entries(layers)){
      if(!/^[a-z][a-z0-9._-]{0,79}$/.test(id)||!values||typeof values!=='object'||Array.isArray(values))throw Error('Invalid element ID.');
      const out={};
      for(const [key,value]of Object.entries(values)){
        if(key==='hidden'){if(typeof value!=='boolean')throw Error('Invalid element visibility.');}
        else if(!['dx','dy','sx','sy','px','py'].includes(key)||!Number.isFinite(value)||(['sx','sy'].includes(key)?value<.05||value>20:Math.abs(value)>10000))throw Error('Invalid element adjustment: '+key);
        out[key]=value;
      }
      result[shot][id]=out;
    }
  }
  return result;
}
export const elementSettings=(motion,shot,id)=>({...ELEMENT_DEFAULTS,...motion?.elements?.[shot]?.[id]});
export const elementTransform=s=>`translate(${s.dx} ${s.dy}) translate(${s.px} ${s.py}) scale(${s.sx} ${s.sy}) translate(${-s.px} ${-s.py})`;
// Resize in a layer's parent coordinate system. Opposite corners stay fixed.
export function resizedElement(base,settings,width,height,corner='se'){
  const sx=Math.max(.05,Math.min(20,width/base.width)),sy=Math.max(.05,Math.min(20,height/base.height));
  let left=base.x+settings.dx+(base.x-settings.px)*(settings.sx-1),top=base.y+settings.dy+(base.y-settings.py)*(settings.sy-1);
  if(corner.includes('w'))left+=base.width*(settings.sx-sx);
  if(corner.includes('n'))top+=base.height*(settings.sy-sy);
  return {...settings,px:base.x,py:base.y,dx:left-base.x,dy:top-base.y,sx,sy};
}
