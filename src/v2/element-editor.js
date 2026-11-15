import {validateMotion} from './motion-settings.js';
import {elementSettings,resizedElement} from './element-settings.js';
const $=id=>document.getElementById(id),round=n=>Math.round(n*1000)/1000;
export function connectElementEditor({getPayload,getShot,getVariant,getPlaying,applyMotion,pauseForEdit,onCommit}){
  const shell=$('canvas-shell'),stage=$('stage'),overlay=$('element-overlay'),fields=$('element-fields'),list=$('element-list');
  let selected='',shot='',drag=null,optionsKey='',undo=[],redo=[],appName='';
  const motion=()=>validateMotion(getPayload().showcase?.motion);
  const find=id=>[...stage.querySelectorAll('[data-element-id]')].find(n=>n.dataset.elementId===id);
  const settings=()=>elementSettings(motion(),getShot().id,selected);
  function status(value){$('element-status').textContent=value;}
  function remember(){undo.push(structuredClone(motion().elements));if(undo.length>80)undo.shift();redo=[];}
  function apply(elements,transient=false){const m=motion();m.elements=elements;applyMotion(m,{transient});if(!transient)onCommit();}
  function change(value,{record=true,transient=false}={}){
    if(!selected)return;if(record)remember();const elements=motion().elements,id=getShot().id;elements[id]={...elements[id],[selected]:value};apply(elements,transient);refresh();
  }
  function box(){const n=find(selected);if(!n)return null;const b=n.dataset.elementBox?JSON.parse(n.dataset.elementBox):n.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};}
  function refresh(){
    const p=getPayload(),id=getShot().id,enabled=!!p.showcase&&getVariant(id)==='original'&&stage.querySelector('svg')?.dataset.shot===id;$('element-panel').hidden=!p.showcase;
    shell.classList.toggle('can-edit',enabled&&$('edit-elements').checked);
    if(appName!==p.app.name){appName=p.app.name;undo=[];redo=[];selected='';}
    if(shot!==id){shot=id;selected='';optionsKey='';}
    const nodes=[...stage.querySelectorAll('[data-element-id]')],entries=nodes.map(n=>[n.dataset.elementId,n.dataset.elementLabel]);
    const key=JSON.stringify(entries);
    if(key!==optionsKey){optionsKey=key;list.replaceChildren(new Option('Select an element',''));for(const [value,label]of entries)list.append(new Option(label,value));}
    list.value=selected;$('element-undo').disabled=!undo.length;$('element-redo').disabled=!redo.length;
    const node=find(selected),valid=enabled&&node;
    fields.hidden=!valid;overlay.hidden=!valid||!$('edit-elements').checked||getPlaying();list.disabled=!enabled;
    if(!valid){if(selected)status('This layer is not visible at this frame. Scrub to its appearance.');return;}
    const base=box(),matrix=node.getScreenCTM(),a=new DOMPoint(base.x,base.y).matrixTransform(matrix),b=new DOMPoint(base.x+base.width,base.y+base.height).matrixTransform(matrix),root=shell.getBoundingClientRect();overlay.style.left=(a.x-root.left)+'px';overlay.style.top=(a.y-root.top)+'px';overlay.style.width=(b.x-a.x)+'px';overlay.style.height=(b.y-a.y)+'px';
    overlay.dataset.hidden=String(settings().hidden);
    if(!drag){const v=settings(),base=box();for(const [field,value]of Object.entries({dx:v.dx,dy:v.dy,width:base.width*v.sx,height:base.height*v.sy})){const input=$('element-'+field);if(document.activeElement!==input)input.value=round(value);} $('element-hidden').checked=v.hidden;}
    status(node.dataset.elementLabel+' · '+(settings().hidden?'hidden':'selected'));
  }
  function select(id){pauseForEdit();selected=id;refresh();}
  list.onchange=()=>select(list.value);
  $('edit-elements').onchange=refresh;
  const point=(event,matrix)=>new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix);
  shell.addEventListener('pointerdown',event=>{
    if(event.button!==0||!$('edit-elements').checked||!getPayload().showcase||getVariant(getShot().id)!=='original')return;
    const handle=event.target.closest('[data-resize]'),target=event.target.closest('[data-element-id]');
    if(!handle&&!target){selected='';refresh();return;}
    const key=handle?selected:target.dataset.elementId;select(key);const node=find(selected);if(!node)return;
    event.preventDefault();shell.focus({preventScroll:true});shell.setPointerCapture(event.pointerId);
    const inverse=node.parentNode.getScreenCTM().inverse();drag={pointer:event.pointerId,corner:handle?.dataset.resize,start:point(event,inverse),inverse,base:box(),value:settings(),before:structuredClone(motion().elements),moved:false};
  });
  shell.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointer)return;
    const p=point(event,drag.inverse),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
    if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<.2)return;
    if(!drag.moved){remember();drag.moved=true;}
    let value={...drag.value};
    if(drag.corner){
      if(drag.base.width<.01||drag.base.height<.01)return;
      const oldW=drag.base.width*value.sx,oldH=drag.base.height*value.sy;
      let w=Math.max(.1,oldW+dx*(drag.corner.includes('w')?-1:1)),h=Math.max(.1,oldH+dy*(drag.corner.includes('n')?-1:1));
      if($('element-ratio').checked||event.shiftKey){const factor=Math.abs(w/oldW-1)>=Math.abs(h/oldH-1)?w/oldW:h/oldH;w=oldW*factor;h=oldH*factor;}
      value=resizedElement(drag.base,value,w,h,drag.corner);
    }else{value.dx=round(value.dx+dx);value.dy=round(value.dy+dy);}
    try{change(value,{record:false,transient:true});}catch(e){status(e.message);}
  });
  function endDrag(event,cancel=false){
    if(!drag||event.pointerId!==drag.pointer)return;const current=drag;drag=null;
    if(shell.hasPointerCapture(event.pointerId))shell.releasePointerCapture(event.pointerId);
    if(current.moved){if(cancel){undo.pop();apply(current.before);}else apply(motion().elements);}
    refresh();
  }
  shell.addEventListener('pointerup',event=>endDrag(event));shell.addEventListener('pointercancel',event=>endDrag(event,true));
  for(const key of ['dx','dy','width','height'])$('element-'+key).onchange=()=>{
    try{pauseForEdit();const value=Number($('element-'+key).value);if(!Number.isFinite(value))throw Error('Enter a finite number.');let next=settings();
      if(key==='dx'||key==='dy')next={...next,[key]:value};
      else {const b=box();if(!b?.width||!b.height||value<=0)throw Error('Size must be greater than zero.');let w=b.width*next.sx,h=b.height*next.sy;if(key==='width'){if($('element-ratio').checked)h*=value/w;w=value;}else{if($('element-ratio').checked)w*=value/h;h=value;}next=resizedElement(b,next,w,h);}
      change(next);
    }catch(e){status(e.message);}
  };
  function nudge(x,y,step){if(!selected||!find(selected))return;pauseForEdit();const s=settings();change({...s,dx:round(s.dx+x*step),dy:round(s.dy+y*step)});}
  for(const button of document.querySelectorAll('[data-nudge]'))button.onclick=()=>{const [x,y]=button.dataset.nudge.split(',').map(Number);nudge(x,y,Number($('nudge-step').value));};
  function travel(from,to){if(!from.length)return;pauseForEdit();to.push(structuredClone(motion().elements));apply(from.pop());refresh();}
  $('element-undo').onclick=()=>travel(undo,redo);$('element-redo').onclick=()=>travel(redo,undo);
  shell.addEventListener('keydown',event=>{
    if(event.key==='Escape'){selected='';refresh();return;}
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)travel(redo,undo);else travel(undo,redo);return;}
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(moves[event.key]&&selected){event.preventDefault();nudge(...moves[event.key],event.altKey ? .1 : event.shiftKey ? 10 : 1);}
  });
  $('element-hidden').onchange=()=>change({...settings(),hidden:$('element-hidden').checked});
  $('element-reset').onclick=()=>{remember();const all=motion().elements;delete all[getShot().id]?.[selected];apply(all);refresh();};
  $('element-deselect').onclick=()=>{selected='';refresh();};
  new ResizeObserver(()=>refresh()).observe(shell);
  return {refresh};
}
