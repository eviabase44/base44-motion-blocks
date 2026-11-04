const NS='http://www.w3.org/2000/svg';
export function el(tag,attrs={},children=[]) {
  const node=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null)node.setAttribute(k,String(v));
  for(const child of children)node.append(typeof child==='string'?document.createTextNode(child):child);
  return node;
}
export const rect=(x,y,width,height,fill,attrs={})=>el('rect',{x,y,width,height,fill,...attrs});
export const group=(children=[],attrs={})=>el('g',attrs,children);
export function text(value,x,top,size,p,{fill=p.theme.ink,weight=p.typography.headlineWeight,opacity=1,anchor='start',...attrs}={}) {
  return el('text',{x,y:top+size*.87,'font-family':p.typography.family,'font-size':size,'font-weight':weight,'letter-spacing':`${p.typography.letterSpacingEm??0}em`,fill,opacity,'text-anchor':anchor,...attrs},[value]);
}
let measuring;
export function width(value,size,p,weight=p.typography.headlineWeight) {
  measuring??=document.createElement('canvas').getContext('2d');
  measuring.font=`${weight} ${size}px "${p.typography.family}"`;
  const spacing=size*(p.typography.letterSpacingEm??0);
  if('letterSpacing' in measuring){measuring.letterSpacing=`${spacing}px`;return measuring.measureText(value).width;}
  return measuring.measureText(value).width+[...value].length*spacing;
}
export function fitRows(rows,p,size,maxWidth,min=size*.78) {
  const max=Math.max(...rows.map(row=>width(row.join(' '),size,p)));
  const fitted=Math.min(size,size*maxWidth/Math.max(1,max));
  if(fitted<min)throw new Error(`Copy is too long for this shot. Shorten the longest line (needs ${Math.round(fitted)}px; minimum ${Math.round(min)}px).`);
  return fitted;
}
export function row(items,x,y,size,p,draw,gap=width(' ',size,p)) {
  for(const item of items){draw(item,x,y);x+=width(item.value,size,p)+gap;}
}
export function mediaSlot(m,x,y,w,h,p,index=0,wireframe=true,labelSize=null) {
  const color=m.color??p.theme.blocks[index%p.theme.blocks.length];
  const nodes=[rect(x,y,w,h,color)];
  if(!wireframe&&m.src){nodes.push(el('svg',{x,y,width:w,height:h,viewBox:`0 0 ${w} ${h}`,overflow:'hidden'},[el('image',{href:m.src,x:0,y:0,width:w,height:h,preserveAspectRatio:'xMidYMid slice'})]));}
  else {
    const size=labelSize??Math.max(7,Math.min(13,w/14)),unit=size/13;
    nodes.push(el('path',{d:'M-9 -9h18v18h-18z M-9 9l18-18',transform:`translate(${x+w/2} ${y+h/2}) scale(${unit})`,fill:'none',stroke:p.theme.ink,'stroke-opacity':.28,'stroke-width':1}));
    nodes.push(text(m.label,x+w/2,y+h/2+20*unit,size,p,{anchor:'middle',weight:p.typography.bodyWeight,opacity:.65}));
  }
  return group(nodes,{'data-slot':m.label});
}
export function watermark(p,x,y,size,opacity=.045){return text(p.app.name,x,y,size,p,{weight:p.typography.wordmarkWeight,opacity});}
export function cursor(x,y,scale=1,p){return el('path',{d:'M0 0 L1 18 L5 14 L9 21 L13 19 L9 12 L16 12 Z',transform:`translate(${x} ${y}) scale(${scale})`,fill:p.theme.ink,stroke:p.theme.surface,'stroke-width':1.5});}
export function stage(children,p,id,frame){return el('svg',{viewBox:'0 0 960 540',xmlns:NS,role:'img','aria-label':`${p.app.name}: ${id}, frame ${frame}`,'data-shot':id,'data-frame':frame,style:'display:block;width:100%;height:100%;overflow:hidden'},children);}
