import {refinedPreset} from './refined-motion.js';
import {controlsFor,MOTION_FIELDS,settingsFor,validateMotion,makeMotionPreset,readMotionPreset,saveMotion,loadMotion,CUT_TYPES,motionStyle,playbackCadence} from './motion-settings.js';
const $=id=>document.getElementById(id);
const normalized=source=>JSON.stringify(validateMotion(source.motion));
export function restoreSavedMotion(payload,storage){
  if(!payload.showcase||payload.showcase.motion!==undefined)return payload;
  const saved=loadMotion(storage,{...payload.showcase,app:payload.app});
  payload.showcase.motion=saved??refinedPreset();
  return payload;
}
export function connectMotionPanel({getPayload,getShot,getVariant,applyMotion,preview,previewCut,useFigma,storage}){
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
    const shot=getShot(),id=shot.id,original=getVariant(id)==='original',style=motionStyle(source()),settings=settingsFor(source(),id);
    $('motion-style').value=style;$('motion-cadence').value=String(playbackCadence(source()));$('refined-options').hidden=style!=='refined';
    const note=document.querySelector('.local-note');if(note)note.textContent=`960 × 540 · ${playbackCadence(source())} fps playback · 19 seconds. Each card stays editable.`;
    $('motion-shot').textContent=shot.name;$('motion-lock').textContent=original?(style==='refined'?'REFINED MOTION':'EARLIER MOTION'):'LEGACY LAYOUT';
    $('motion-cut').textContent=id==='ending'?'Adjust the symbol hold. Move or resize any layer below.':style==='refined'?'Staggered entrances, eased landings and readable holds. Adjust this shot below.':'The earlier animation is preserved. Choose how this shot cuts into the next one.';
    $('motion-fields').hidden=!original;$('motion-layout-note').hidden=original;$('motion-use-figma').hidden=original;
    $('cut-controls').hidden=id==='ending';$('cut-type').value=settings.cutType;$('cut-frames').value=settings.cutFrames;$('cut-duration-value').value=(settings.cutFrames/12).toFixed(2)+'s';$('cut-duration-field').hidden=settings.cutType==='cut';
    $('motion-reset').disabled=!original;
    $('motion-fields').replaceChildren();
    for(const key of controlsFor(id,style)){
      const spec=MOTION_FIELDS[key],wrap=document.createElement('div'),row=document.createElement('div'),label=document.createElement('label'),output=document.createElement('output'),input=document.createElement('input');
      wrap.className='motion-field';input.type='range';input.id='motion-'+key;input.min=spec.min;input.max=spec.max;input.step=spec.step;input.value=settings[key];label.htmlFor=input.id;label.textContent=spec.label;output.htmlFor=input.id;output.value=spec.format(settings[key]);input.setAttribute('aria-valuetext',output.value);
      input.oninput=()=>{const value=Number(input.value);output.value=spec.format(value);input.setAttribute('aria-valuetext',output.value);const m=validateMotion(source().motion);m.shots[id]={...m.shots[id],[key]:value};try{commit(m);}catch(e){status(e.message,true);}};
      input.onchange=preview;row.append(label,output);wrap.append(row,input);$('motion-fields').append(wrap);
    }
    report();
  }
  $('motion-style').onchange=()=>{const m=validateMotion(source().motion);m.style=$('motion-style').value;commit(m);refresh();preview();};
  $('motion-cadence').onchange=()=>{const m=validateMotion(source().motion);m.cadence=Number($('motion-cadence').value);commit(m);refresh();preview();};
  $('motion-refine').onclick=()=>{commit(refinedPreset(validateMotion(source().motion).elements));refresh();preview();};
  for(const [value,label]of Object.entries(CUT_TYPES)){const option=document.createElement('option');option.value=value;option.textContent=label;$('cut-type').append(option);}
  function setCut(key,value){const m=validateMotion(source().motion),id=getShot().id;m.shots[id]={...m.shots[id],[key]:value};commit(m);}
  $('cut-type').onchange=()=>{setCut('cutType',$('cut-type').value);$('cut-duration-field').hidden=$('cut-type').value==='cut';previewCut();};
  $('cut-frames').oninput=()=>{setCut('cutFrames',Number($('cut-frames').value));$('cut-duration-value').value=(Number($('cut-frames').value)/12).toFixed(2)+'s';};
  $('cut-frames').onchange=previewCut;$('preview-cut').onclick=previewCut;
  $('motion-save').onclick=()=>{try{saveMotion(storage,source());refreshSaved();report();}catch(e){status('Could not save here. Download the tweaks instead. '+e.message,true);}};
  $('motion-load').onclick=()=>{try{const value=loadMotion(storage,source());if(!value)throw Error('No saved tweaks for this app.');commit(value);refresh();preview();}catch(e){status(e.message,true);}};
  $('motion-reset').onclick=()=>{const m=validateMotion(source().motion),id=getShot().id;if(m.style==='refined')m.shots[id]=refinedPreset().shots[id];else delete m.shots[id];commit(m);refresh();preview();};
  $('motion-preview').onclick=preview;$('motion-use-figma').onclick=()=>{useFigma();refresh();};
  $('motion-download').onclick=()=>{const value=JSON.stringify(makeMotionPreset(source()),null,2),url=URL.createObjectURL(new Blob([value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='base44-animation-tweaks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Downloaded all shot tweaks.');};
  $('motion-import').onclick=()=>$('motion-file').click();
  $('motion-file').onchange=async()=>{const file=$('motion-file').files[0];if(!file)return;try{if(file.size>1048576)throw Error('Choose an animation preset smaller than 1 MB.');const value=readMotionPreset(JSON.parse(await file.text()));commit(value);refresh();preview();status('Imported. Save tweaks to keep them on this browser.');}catch(e){status(e.message,true);}finally{$('motion-file').value='';}};
  return {refresh,report};
}
