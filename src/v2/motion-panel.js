import {controlsFor,MOTION_SHOTS,MOTION_FIELDS,settingsFor,validateMotion,makeMotionPreset,readMotionPreset,saveMotion,loadMotion,MATCH_CUTS} from './motion-settings.js';
const $=id=>document.getElementById(id);
const normalized=source=>JSON.stringify(validateMotion(source.motion));
export function restoreSavedMotion(payload,storage){
  if(!payload.showcase||payload.showcase.motion!==undefined)return payload;
  const saved=loadMotion(storage,{...payload.showcase,app:payload.app});
  if(saved)payload.showcase.motion=saved;
  return payload;
}
export function connectMotionPanel({getPayload,getShot,getVariant,applyMotion,preview,useFigma,storage}){
  let saved=null,identity=null,available=false;
  const status=(message,error=false)=>{$('motion-status').textContent=message;$('motion-status').dataset.error=String(error);};
  const source=()=>({...getPayload().showcase,app:getPayload().app});
  function refreshSaved(){
    try{const s=source(),value=loadMotion(storage,s);saved=value?JSON.stringify(value):null;available=!!value;$('motion-load').disabled=!available;}
    catch(e){saved=null;available=false;$('motion-load').disabled=true;status('Could not read saved tweaks: '+e.message,true);}
  }
  function report(){status(saved===normalized(source())?'Saved on this browser.':source().motion?'Unsaved tweaks. Save to keep them on this browser.':'Default motion.');}
  function commit(motion){applyMotion(validateMotion(motion));report();}
  function refresh(){
    const p=getPayload();$('motion-panel').hidden=!p.showcase;if(!p.showcase)return;
    if(identity!==p.app.name){identity=p.app.name;refreshSaved();}
    const shot=getShot(),id=shot.id,original=getVariant(id)==='original',allMatched=MOTION_SHOTS.every(s=>getVariant(s)==='original'),settings=settingsFor(source(),id);
    $('motion-shot').textContent=shot.name;$('motion-lock').textContent=allMatched?'MATCH CUTS':'MIXED LAYOUTS';
    const join=MATCH_CUTS.find(c=>c.from===id);$('motion-cut').textContent=join?join.match+'. Matching poses stay locked.':'The arrow and logo hold through the ending. Final credit stays fixed.';
    $('motion-fields').hidden=!original;$('motion-layout-note').hidden=allMatched;$('motion-use-figma').hidden=allMatched;
    $('motion-reset').disabled=!original;
    $('motion-fields').replaceChildren();
    for(const key of controlsFor(id)){
      const spec=MOTION_FIELDS[key],wrap=document.createElement('div'),row=document.createElement('div'),label=document.createElement('label'),output=document.createElement('output'),input=document.createElement('input');
      wrap.className='motion-field';input.type='range';input.id='motion-'+key;input.min=spec.min;input.max=spec.max;input.step=spec.step;input.value=settings[key];label.htmlFor=input.id;label.textContent=spec.label;output.htmlFor=input.id;output.value=spec.format(settings[key]);input.setAttribute('aria-valuetext',output.value);
      input.oninput=()=>{const value=Number(input.value);output.value=spec.format(value);input.setAttribute('aria-valuetext',output.value);const m=validateMotion(source().motion);m.shots[id]={...m.shots[id],[key]:value};try{commit(m);}catch(e){status(e.message,true);}};
      input.onchange=preview;row.append(label,output);wrap.append(row,input);$('motion-fields').append(wrap);
    }
    report();
  }
  $('motion-save').onclick=()=>{try{saveMotion(storage,source());refreshSaved();report();}catch(e){status('Could not save here. Download the tweaks instead. '+e.message,true);}};
  $('motion-load').onclick=()=>{try{const value=loadMotion(storage,source());if(!value)throw Error('No saved tweaks for this app.');commit(value);refresh();preview();}catch(e){status(e.message,true);}};
  $('motion-reset').onclick=()=>{const m=validateMotion(source().motion);delete m.shots[getShot().id];commit(m);refresh();preview();};
  $('motion-preview').onclick=preview;$('motion-use-figma').onclick=()=>{useFigma();refresh();};
  $('motion-download').onclick=()=>{const value=JSON.stringify(makeMotionPreset(source()),null,2),url=URL.createObjectURL(new Blob([value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='base44-animation-tweaks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Downloaded all shot tweaks.');};
  $('motion-import').onclick=()=>$('motion-file').click();
  $('motion-file').onchange=async()=>{const file=$('motion-file').files[0];if(!file)return;try{if(file.size>65536)throw Error('Choose an animation preset smaller than 64 KB.');const value=readMotionPreset(JSON.parse(await file.text()));commit(value);refresh();preview();status('Imported. Save tweaks to keep them on this browser.');}catch(e){status(e.message,true);}finally{$('motion-file').value='';}};
  return {refresh};
}
