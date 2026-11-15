// The v2 experiment accepts host-supplied observations. It never invents live telemetry.
export const FPS = 12;
export const BEATS = Object.freeze([
  {id:'hook',name:'Opening',frames:72},
  {id:'reveal',name:'Homepage scroll',frames:36},
  {id:'collage',name:'Feature bundle',frames:24},
  {id:'focus',name:'Feature 1',frames:24},
  {id:'focus2',name:'Feature 2',frames:24},
  {id:'focus3',name:'Feature 3',frames:24},
  {id:'ending',name:'Proudly built',frames:24}
].map((b,i,a)=>Object.freeze({...b,start:a.slice(0,i).reduce((n,x)=>n+x.frames,0)})));
export const TOTAL_FRAMES = BEATS.reduce((n,b)=>n+b.frames,0);
export const DURATION = TOTAL_FRAMES/FPS;
const finite = (n,min,max) => Number.isFinite(n)&&n>=min&&n<=max;
const safeURL = s => typeof s==='string' && /^(https?:\/\/|\/(?!\/)|\.\.?\/)/.test(s) && !/[<>\s]/.test(s);
function requireText(value,name,max=120){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`${name} needs 1–${max} characters.`);}
function region(r,m,name){if(!r||!['x','y','width','height'].every(k=>Number.isFinite(r[k]))||r.x<0||r.y<0||r.width<=0||r.height<=0||r.x+r.width>m.width+.01||r.y+r.height>m.height+.01)throw Error(`${name} must fit within its source image.`);}
export function validateSource(input){
  const p=structuredClone(input);
  if(p.version!==2)throw Error('This flow needs a version 2 source.');
  requireText(p.app?.name,'App name',48);requireText(p.description,'App description',150);
  if(!['simulated','provided'].includes(p.signalMode))throw Error('signalMode must be simulated or provided.');
  for(const k of ['primary','accent','surface','ink','onPrimary'])if(!/^#[\da-f]{6}$/i.test(p.theme?.[k]))throw Error(`Invalid ${k} color.`);
  requireText(p.typography?.family,'Font family',80);
  if(p.typography.src&&!safeURL(p.typography.src))throw Error('Invalid font URL.');
  for(const key of ['headlineWeight','bodyWeight','wordmarkWeight'])if(!finite(p.typography[key],100,900))throw Error('Invalid font weight.');
  if(!finite(p.typography.letterSpacingEm??0,-.1,.2))throw Error('Invalid letter spacing.');
  function media(m,name){
    if(!m||!safeURL(m.src)||!finite(m.width,80,12000)||!finite(m.height,80,20000))throw Error(`${name} needs a valid image URL and dimensions.`);
    if(m.region)region(m.region,m,name+' region');
    if(m.hover){region(m.hover,m,name+' hover');const r=sourceRegion(m);if(m.hover.x<r.x||m.hover.y<r.y||m.hover.x+m.hover.width>r.x+r.width||m.hover.y+m.hover.height>r.y+r.height)throw Error(`${name} hover must fit inside the selected region.`);}
  }
  media(p.homepage,'Homepage');
  if(p.homepage.windowHeight!==undefined&&!finite(p.homepage.windowHeight,80,(p.homepage.region?.height??p.homepage.height)))throw Error('Homepage windowHeight exceeds the available capture.');
  if(!Array.isArray(p.features)||p.features.length<3||p.features.length>40)throw Error('Provide 3–40 feature candidates.');
  const ids=new Set();
  for(const f of p.features){
    requireText(f.id,'Feature ID',60);if(ids.has(f.id))throw Error('Feature IDs must be unique.');ids.add(f.id);
    requireText(f.name,'Feature name',50);requireText(f.title,'Feature title',90);requireText(f.family,'Feature family',60);
    media(f.media,f.name);
    for(const [key,max] of [['credits',1e9],['visualRichness',100],['viewport',1]])if(f.signals?.[key]!==null&&!finite(f.signals?.[key],0,max))throw Error(`${f.name}: invalid ${key} signal. Use null for missing observations.`);
    if(f.available!==undefined&&typeof f.available!=='boolean')throw Error('available must be a boolean.');
  }
  if(p.audio&&(!safeURL(p.audio.src)||!finite(p.audio.volume??.75,0,1)))throw Error('Invalid audio source.');
  return p;
}
// Lexicographic, not a weighted sum: a secondary signal cannot outrank credits.
// An incomplete signal is omitted for the whole comparison, avoiding a bias toward known values.
export function rankFeatures(source){
  const eligible=source.features.filter(f=>f.available!==false);
  const keys=['credits','visualRichness','viewport'].filter(k=>eligible.every(f=>f.signals[k]!==null));
  const ranked=[...eligible].sort((a,b)=>{
    for(const k of keys){const av=k==='viewport'?Number(a.signals[k]>.6):a.signals[k];const bv=k==='viewport'?Number(b.signals[k]>.6):b.signals[k];if(av!==bv)return bv-av;}
    return a.id.localeCompare(b.id);
  });
  const selected=[],families=new Set(),visuals=new Set();
  const decisions=ranked.map(f=>{
    const r=f.media.region;const visual=JSON.stringify([f.media.src,r??null]);
    const reason=families.has(f.family)?'Same feature family':visuals.has(visual)?'Repeated visual':selected.length===3?'Below the top three':'Selected';
    if(reason==='Selected'){selected.push(f);families.add(f.family);visuals.add(visual);}
    return {id:f.id,reason};
  });
  for(const f of source.features.filter(f=>f.available===false))decisions.push({id:f.id,reason:'No populated feature content'});
  if(selected.length!==3)throw Error('Three distinct, populated features with different visuals are needed. Connect more feature screens.');
  return {selected,decisions,keys,missing:['credits','visualRichness','viewport'].filter(k=>!keys.includes(k))};
}
export function locateFrame(value){const frame=Math.max(0,Math.min(TOTAL_FRAMES-1,Math.floor(Number(value)||0)));const beat=BEATS.find(b=>frame<b.start+b.frames);return {beat,frame,local:frame-beat.start,progress:(frame-beat.start)/(beat.frames-1)};}
export function fitRect(source,box){const scale=Math.min(box.width/source.width,box.height/source.height);return {x:box.x+(box.width-source.width*scale)/2,y:box.y+(box.height-source.height*scale)/2,width:source.width*scale,height:source.height*scale,scale};}
export function sourceRegion(media){return media.region??{x:0,y:0,width:media.width,height:media.height};}
export function scrollRegion(media,progress){const r=sourceRegion(media),height=Math.min(r.height,media.windowHeight??r.height);return {...r,y:r.y+(r.height-height)*Math.max(0,Math.min(1,progress)),height};}
export function planSequence(input){const source=validateSource(input),selection=rankFeatures(source);return {source,...selection,beats:BEATS,duration:TOTAL_FRAMES/FPS};}
