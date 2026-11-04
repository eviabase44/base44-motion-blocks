import {DAZZED_FONT_URL} from './brand.js';
import {createMotionPlayer,renderShot,SHOTS,FPS,TOTAL_FRAMES} from './player.js';
import {getShot,getFeatureMedia} from './contracts.js';
import {makeProfile} from './data/profiles.js';
import {SHOT_VARIANTS,decodeVariants,encodeVariants} from './variants.js';
import {initialWireframe,mediaSources,preloadMedia} from './media.js';
import {connectURLImporter} from './importer.js';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
let profile=['wireframe','forma','atlas','imported'].includes(params.get('app'))?params.get('app'):'wireframe';
let selected=SHOTS.some(s=>s.id===params.get('shot'))?params.get('shot'):'hook',payload=makeProfile(profile==='imported'?'wireframe':profile),player,sequence=false,binding=0,importedMetadata=null;
let variants=decodeVariants();try{variants=decodeVariants(params.get('layouts')??'');}catch(e){showError(e);}
try{const hash=new URLSearchParams(location.hash.slice(1)),encoded=hash.get('payload');if(encoded)payload=JSON.parse(encoded);if(hash.get('import'))importedMetadata=JSON.parse(hash.get('import'));}catch(e){showError(e);}
const embed=params.get('embed')==='1';if(embed)document.body.classList.add('embed');
function html(tag,attrs={},text){const node=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')node.className=v;else node.setAttribute(k,v);}if(text!==undefined)node.textContent=text;return node;}
function showError(e){$('error').hidden=false;$('error').textContent=e.message;$('sync-status').textContent='Needs attention';$('sync-status').style.background='#ffe8db';}
function clearError(){$('error').hidden=true;$('sync-status').textContent='Synced';$('sync-status').style.background='';}
function portable(){const p=structuredClone(payload);if(p.typography.src?.endsWith('/assets/fonts/Dazzed-SemiBold.ttf'))p.typography.src=DAZZED_FONT_URL;else if(p.typography.src?.endsWith('/assets/fonts/Figtree.ttf'))p.typography.src='./assets/fonts/Figtree.ttf';return p;}
function persistMediaMode(){const u=new URL(location.href);u.searchParams.set('wireframe',player.getWireframe()?'1':'0');history.replaceState(null,'',u);$('wireframe-mode').checked=player.getWireframe();$('media-mode-label').textContent=player.getWireframe()?'COLOR BLOCKS':'APP SCREENS';}
function persistImported(){if(profile!=='imported')return;const url=new URL(location.href);url.hash=new URLSearchParams({payload:JSON.stringify(payload),...(importedMetadata?{import:JSON.stringify(importedMetadata)}:{})});history.replaceState(null,'',url);}
function updateLinks(){const url=new URL(location.href);url.search='';url.searchParams.set('shot',selected);url.searchParams.set('app',profile);url.searchParams.set('embed','1');url.searchParams.set('wireframe',player?.getWireframe()?'1':'0');const encoded=encodeVariants(variants);if(encoded)url.searchParams.set('layouts',encoded);url.hash=new URLSearchParams({payload:JSON.stringify(payload)}).toString();$('isolate').href=url.href;}
function thumbnails(){for(const s of SHOTS){const tile=$(`thumb-${s.id}`);tile.querySelector('.mini').replaceChildren(renderShot(s.id,s.frames-1,payload,{variant:variants[s.id],wireframe:player?.getWireframe()??true}));}}
function layoutChoices(){
  const container=$('layout-options');container.replaceChildren();
  $('layout-count').textContent='17 LAYOUTS · 5 CARDS';
  $('fixed-ending-note').hidden=selected!=='ending';
  for(const [index,shot] of SHOTS.entries()){
    const section=html('section',{class:'layout-group','data-shot-group':shot.id,'aria-labelledby':`layout-heading-${shot.id}`});
    const heading=html('div',{class:'section-heading layout-group-heading'}),grid=html('div',{class:'layout-options'});
    heading.append(html('h3',{id:`layout-heading-${shot.id}`},`${String(index+1).padStart(2,'0')} / ${shot.name}`),html('span',{},`${selected===shot.id?'EDITING · ':''}${shot.id==='ending'?'FIXED END CARD':'4 LAYOUTS'}`));
    for(const v of SHOT_VARIANTS[shot.id]){
      const button=html('button',{class:'layout-option','data-shot':shot.id,'data-layout':v.id,'aria-label':`${shot.name} · ${v.name} layout`,'aria-pressed':String(variants[shot.id]===v.id),'data-active':String(selected===shot.id&&variants[shot.id]===v.id)}),mini=html('div',{class:'mini'});
      try{mini.append(renderShot(shot.id,shot.frames-1,payload,{variant:v.id,wireframe:player?.getWireframe()??true}));}
      catch(e){button.disabled=true;button.title=e.message;mini.append(html('p',{class:'layout-error'},'Shorten copy to use this layout'));}
      button.append(mini,html('strong',{},v.name),html('span',{},v.description));button.onclick=()=>chooseVariant(shot.id,v.id);grid.append(button);
      if(v.source&&!button.disabled)button.title=`${v.source.video} · source frames ${v.source.frames.join('–')}`;
    }
    section.append(heading,grid);container.append(section);
  }
}
function chooseVariant(shot,id){
  try{player.setVariant(shot,id);variants=player.getVariants();clearError();choose(shot,false);thumbnails();
    const url=new URL(location.href),encoded=encodeVariants(variants);if(encoded)url.searchParams.set('layouts',encoded);else url.searchParams.delete('layouts');history.replaceState(null,'',url);
    player.seekFrame(0);player.play();
    $('shot-tabs').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }catch(e){showError(e);}
}
function syncIdentity(){$('app-name').value=payload.app.name;const family=payload.typography.family;if(![...$('font-family').options].some(o=>o.value===family))$('font-family').append(html('option',{value:family},family+' · imported'));$('font-family').value=family;if(profile==='imported'&&!$('profile-imported'))$('profile').append(html('option',{id:'profile-imported',value:'imported',disabled:''},payload.app.name+' · imported'));$('profile').value=profile;for(const k of ['primary','surface','onPrimary','accent','ink'])$(`color-${k}`).value=payload.theme[k];}
async function bind(next,{fields=false}={}) {
  const ticket=++binding;$('sync-status').textContent='Syncing…';
  try {const accepted=await player.update(next);if(!accepted||ticket!==binding)return;payload=player.getPayload();clearError();thumbnails();layoutChoices();$('payload-json').value=JSON.stringify(portable(),null,2);updateLinks();persistImported();if(fields){syncIdentity();contentFields();}}
  catch(e){if(ticket===binding)showError(e);}
}
function mutate(change){const next=structuredClone(payload);change(next);return bind(next);}
function inputField(label,value,onInput,max=22){const wrap=html('div',{class:'field'}),id=`field-${label.replace(/\W+/g,'-').toLowerCase()}`,lab=html('label',{for:id},label),input=html('input',{id,type:'text',maxlength:max});input.value=value;input.addEventListener('input',()=>onInput(input.value));wrap.append(lab,input);return wrap;}
function mediaRow(m,index,onChange,graphic=false){const wrap=html('div',{class:'media-row'}),color=html('input',{type:'color','aria-label':`${m.label} block color`}),label=html('input',{type:'text','aria-label':`Media slot ${index+1} label`,maxlength:32});color.value=m.color??payload.theme.blocks[index%payload.theme.blocks.length];label.value=graphic?`GRAPHIC CARD ${String(index+1).padStart(2,'0')}`:m.label;if(graphic)label.disabled=true;color.addEventListener('input',()=>onChange('color',color.value));label.addEventListener('input',()=>onChange('label',label.value));wrap.append(color,label);return wrap;}
function contentFields(){const s=getShot(selected);$('content-title').textContent=s.name+' copy';const fields=$('content-fields'),media=$('media-fields');fields.replaceChildren();media.replaceChildren();
  document.querySelector('.media-section').hidden=selected==='ending';
  const key={hook:'hook',reveal:'reveal',focus:'focus'}[selected];
  if(key){const grid=html('div',{class:'field-grid'}),labels=key==='hook'?['Intro','App type','Connector','Benefit','Subject','Outcome']:key==='reveal'?['Line 1 · A','Line 1 · B','Line 2 · A','Line 2 · B','Line 3']:['Top word','Middle · A','Middle · B','Bottom word'];payload.copy[key].forEach((v,i)=>grid.append(inputField(labels[i],v,value=>mutate(p=>{p.copy[key][i]=value;}),key==='focus'?12:key==='reveal'?20:22)));fields.append(grid);}
  if(selected==='collage')payload.cards.forEach((c,i)=>{fields.append(inputField(`Card ${String(i+1).padStart(2,'0')}`,c.title,value=>mutate(p=>{p.cards[i].title=value;}),34));media.append(mediaRow(c.media,i,(key,value)=>mutate(p=>{p.cards[i].media[key]=value;}),[3,4,6].includes(i)));});
  if(selected==='focus')fields.append(inputField('Feature context',payload.copy.detail,value=>mutate(p=>{p.copy.detail=value;}),55));
  if(selected==='ending')fields.append(html('p',{class:'media-note'},'“Proudly built on” above the Base44 symbol and wordmark. Colors and typography follow the selected app.'));
  if(selected==='focus'){
    const images=getFeatureMedia(payload);
    if(images.length===3)media.append(html('p',{class:'media-note'},'Three images scroll upward in order, one at a time.'));
    images.forEach((m,i)=>media.append(mediaRow(m,i+1,(key,value)=>mutate(p=>{getFeatureMedia(p)[i][key]=value;}))));
  }
  if(selected==='reveal')media.append(mediaRow(payload.media.hero,0,(key,value)=>mutate(p=>{p.media.hero[key]=value;})));
  if(selected==='hook')media.append(html('p',{class:'media-note'},variants.hook==='karaoke'?'The media window uses the app reveal image.':'This shot is all live type. Its background and text colors come from the app palette.'));
}
function selectionUI(){const s=getShot(selected);$('shot-title').textContent=s.name;$('shot-description').textContent=s.description;$('shot-duration').textContent=(s.frames/FPS).toFixed(2)+'s';for(const shot of SHOTS){$(`tab-${shot.id}`).setAttribute('aria-selected',String(shot.id===selected));$(`thumb-${shot.id}`).setAttribute('aria-current',String(shot.id===selected));}contentFields();layoutChoices();updateLinks();}
function onFrame(state){if(state.shot!==selected){selected=state.shot;selectionUI();}$('scrub').max=state.totalFrames-1;$('scrub').value=state.frame;$('time').value=`${state.seconds.toFixed(2)} / ${state.duration.toFixed(2)}`;$('frame-count').textContent=`FRAME ${String(state.frame).padStart(2,'0')} / ${state.totalFrames-1}`;$('play').innerText=state.playing?'Ⅱ Pause':'▶ Play';$('play').setAttribute('aria-label',state.playing?'Pause shot':'Play shot');$('loop').checked=state.loop;$('shot-duration').textContent=sequence?'15.00s sequence':(getShot(selected).frames/FPS).toFixed(2)+'s';}
function choose(id,play=true){sequence=false;selected=id;player.setShot(id);selectionUI();const url=new URL(location.href);url.searchParams.set('shot',id);url.searchParams.set('app',profile);history.replaceState(null,'',url);if(play)player.play();else player.seekFrame(getShot(id).frames-1);}
for(const [i,s]of SHOTS.entries()){
  const button=html('button',{id:`tab-${s.id}`,role:'tab','aria-selected':String(s.id===selected)});button.append(html('span',{},String(i+1).padStart(2,'0')),document.createTextNode(s.name));button.onclick=()=>choose(s.id);$('shot-tabs').append(button);
  const tile=html('button',{id:`thumb-${s.id}`,class:'thumb','aria-label':`Preview ${s.name}`});tile.append(html('div',{class:'mini'}),html('span',{},`${String(i+1).padStart(2,'0')} / ${s.name}`));tile.onclick=()=>choose(s.id);$('thumbnails').append(tile);
}
for(const [k,label]of [['primary','Primary'],['surface','Surface'],['onPrimary','Type'],['accent','Accent'],['ink','Ink']]){const wrap=html('label',{for:`color-${k}`},label),input=html('input',{type:'color',id:`color-${k}`,'aria-label':label+' color'});input.oninput=()=>mutate(p=>{p.theme[k]=input.value;});wrap.prepend(input);$('palette').append(wrap);}
try {

  const wireframe=initialWireframe(payload,{imported:profile==='imported',setting:params.get('wireframe')});
  let initialMediaError;
  if(!wireframe)try{await preloadMedia(payload);}catch(error){initialMediaError=error;}
  player=await createMotionPlayer($('stage'),{payload,shot:selected,variants,wireframe,onFrame});persistMediaMode();
  syncIdentity();selectionUI();thumbnails();persistImported();$('payload-json').value=JSON.stringify(portable(),null,2);
  if(embed){player.setLoop(true);player.play();}else player.seekFrame(getShot(selected).frames-1);
  $('play').onclick=()=>player.getState().playing?player.pause():player.play();
  $('restart').onclick=()=>{player.seekFrame(0);player.play();};
  $('scrub').oninput=()=>{const frame=Number($('scrub').value);player.pause();player.seekFrame(frame);};
  $('previous-frame').onclick=()=>{player.pause();player.seekFrame(player.getState().frame-1);};
  $('next-frame').onclick=()=>{player.pause();player.seekFrame(player.getState().frame+1);};
  $('loop').onchange=()=>player.setLoop($('loop').checked);
  $('full-sequence').onclick=()=>{sequence=true;player.setSequence(SHOTS.map(s=>s.id));player.play();};
  $('profile').onchange=async()=>{profile=$('profile').value;await bind(makeProfile(profile),{fields:true});const url=new URL(location.href);url.searchParams.set('app',profile);url.hash='';history.replaceState(null,'',url);$('import-result').hidden=true;$('import-status').hidden=true;importedMetadata=null;};
  $('wireframe-mode').onchange=()=>{player.setWireframe($('wireframe-mode').checked);persistMediaMode();thumbnails();layoutChoices();updateLinks();};
  $('app-name').oninput=()=>mutate(p=>{p.app.name=$('app-name').value;});
  $('font-family').onchange=()=>mutate(p=>{const font=$('font-family').value;if(font===p.typography.family)return;p.typography.family=font;const asset={Dazzed:'Dazzed-SemiBold.ttf',Figtree:'Figtree.ttf'}[font];p.typography.src=font==='Dazzed'?DAZZED_FONT_URL:asset?new URL('../assets/fonts/'+asset,import.meta.url).href:null;p.typography.headlineWeight=font==='Dazzed'?600:font==='Figtree'?500:400;p.typography.bodyWeight=p.typography.headlineWeight;p.typography.wordmarkWeight=font==='Dazzed'?600:font==='Figtree'?900:700;p.typography.letterSpacingEm=-.03;});
  $('apply-json').onclick=()=>{try{const p=JSON.parse($('payload-json').value);bind(p,{fields:true});}catch(e){showError(e);}};
  $('download-json').onclick=()=>{const blob=new Blob([JSON.stringify(portable(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=html('a',{href:url,download:'app-motion-payload.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const importer=connectURLImporter({
    getTemplate:()=>({payload:portable(),variants:player.getVariants(),wireframe:player.getWireframe()}),
    async applyTemplate(result){
      await preloadMedia(result.payload);player.pause();++binding;
      try{if(!await player.applyTemplate({...result,wireframe:false}))throw Error('A newer edit replaced this import. Generate again when ready.');}
      catch(error){if(!error.message.startsWith('Cannot load app font'))throw error;result.warnings.push(`${result.payload.typography.family} could not load. Dazzed Semibold is used.`);result.payload.typography={family:'Dazzed',src:DAZZED_FONT_URL,headlineWeight:600,bodyWeight:600,wordmarkWeight:600,letterSpacingEm:-.03};await player.applyTemplate({...result,wireframe:false});}
      payload=player.getPayload();variants=player.getVariants();profile='imported';persistMediaMode();importedMetadata={source:result.source,sourceAssets:result.sourceAssets,reasons:result.reasons,warnings:result.warnings,provider:result.provider,duration:result.duration,generatedAt:result.generatedAt};
      let option=$('profile-imported');if(!option){option=html('option',{id:'profile-imported',value:'imported',disabled:''});$('profile').append(option);}option.textContent=payload.app.name+' · imported';
      syncIdentity();clearError();thumbnails();selectionUI();$('payload-json').value=JSON.stringify(portable(),null,2);
      const url=new URL(location.href);url.searchParams.set('app',profile);url.searchParams.set('layouts',encodeVariants(variants));url.searchParams.set('shot','hook');history.replaceState(null,'',url);persistImported();updateLinks();
    },
    onApplied(){sequence=true;player.setLoop(false);player.setSequence(SHOTS.map(s=>s.id));player.play();$('shot-tabs').scrollIntoView({behavior:'smooth',block:'start'});}
  });
  if(profile==='imported'&&importedMetadata){importer.showResult({...importedMetadata,payload,variants});$('app-url').value=importedMetadata.source?.url??'';importer.checkConnection();}
  if(initialMediaError)showError(initialMediaError);
  window.addEventListener('pagehide',()=>player.destroy(),{once:true});
}catch(e){showError(e);$('stage').replaceChildren(html('p',{class:'error'},e.message));}
