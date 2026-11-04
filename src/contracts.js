export const FPS = 12;
export const WIDTH = 960;
export const HEIGHT = 540;
export const SHOTS = Object.freeze([
  {id:'hook', name:'Opening', frames:36, source:7272, description:'Six content groups arrive in three lines.', slots:['copy.hook']},
  {id:'reveal', name:'App reveal', frames:36, source:6819, description:'Progressive type beside the main app screen.', slots:['copy.reveal','media.hero']},
  {id:'collage', name:'Card burst', frames:26, source:7052, description:'Nine independent cards enter on measured paths.', slots:['cards[0…8]']},
  {id:'focus', name:'Feature focus', frames:46, source:6866, description:'Three feature images scroll through one window between headline rows.', slots:['copy.focus','copy.detail','media.features[0…2]']},
  {id:'ending', name:'Proudly built', frames:36, source:82, description:'Proudly built on, with the official Base44 logo.', slots:['theme','typography']}
]);
export const TOTAL_FRAMES = SHOTS.reduce((sum,s)=>sum+s.frames,0);
export function getShot(id) {
  const shot=SHOTS.find(s=>s.id===id);
  if(!shot) throw new Error(`Unknown shot: ${id}`);
  return shot;
}
export function clampFrame(frame,count) {
  if(!Number.isFinite(frame)) throw new Error('Frame must be a finite number');
  return Math.max(0,Math.min(count-1,Math.floor(frame)));
}
export function locateFrame(frame,sequence=SHOTS.map(s=>s.id)) {
  if(!sequence.length) throw new Error('Sequence cannot be empty');
  const total=sequence.reduce((n,id)=>n+getShot(id).frames,0);
  let local=clampFrame(frame,total);
  for(let i=0;i<sequence.length;i++) {
    const shot=getShot(sequence[i]);
    if(local<shot.frames)return {shot,index:i,frame:local};
    local-=shot.frames;
  }
}
export function safeAssetURL(value) {
  if(typeof value!=='string'||!value.trim())return false;
  const s=value.trim();
  return /^(https?:\/\/|blob:)/i.test(s)||(!/^[\w+.-]+:/.test(s)&&!s.startsWith('//')&&!/[\u0000-\u001f]/.test(s));
}
export function getFeatureMedia(p){return p.media.features??[p.media.feature];}
export function validatePayload(p) {
  const errors=[];
  const str=(v,path,max=100)=>{if(typeof v!=='string'||!v.trim()||v.length>max)errors.push(`${path}: required text, at most ${max} characters`);};
  str(p?.app?.name,'app.name',24);
  if(!['app','agent','website','tool'].includes(p?.app?.kind))errors.push('app.kind: app, agent, website or tool');
  for(const k of ['primary','surface','onPrimary','accent','ink'])if(!/^#[0-9a-f]{6}$/i.test(p?.theme?.[k]??''))errors.push(`theme.${k}: six-digit hex color required`);
  if(!Array.isArray(p?.theme?.blocks)||p.theme.blocks.length<3||p.theme.blocks.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))errors.push('theme.blocks: at least three hex colors required');
  str(p?.typography?.family,'typography.family',64);
  for(const k of ['headlineWeight','bodyWeight','wordmarkWeight'])if(!Number.isInteger(p?.typography?.[k])||p.typography[k]<100||p.typography[k]>900)errors.push(`typography.${k}: weight 100–900 required`);
  const tracking=p?.typography?.letterSpacingEm;
  if(tracking!==undefined&&(!Number.isFinite(tracking)||tracking<-.1||tracking>.2))errors.push('typography.letterSpacingEm: number from -0.1 to 0.2 required');
  if(p?.typography?.src&&!safeAssetURL(p.typography.src))errors.push('typography.src: invalid font URL');
  for(const [key,n,max] of [['hook',6,22],['reveal',5,20],['focus',4,12]]) {
    if(!Array.isArray(p?.copy?.[key])||p.copy[key].length!==n)errors.push(`copy.${key}: exactly ${n} groups required`);
    else p.copy[key].forEach((v,i)=>str(v,`copy.${key}[${i}]`,max));
  }
  str(p?.copy?.category,'copy.category',35);str(p?.copy?.detail,'copy.detail',55);
  const media=(m,path)=>{str(m?.label,`${path}.label`,32);if(m?.src&&!safeAssetURL(m.src))errors.push(`${path}.src: invalid image URL`);if(m?.color&&!/^#[0-9a-f]{6}$/i.test(m.color))errors.push(`${path}.color: hex color required`);};
  media(p?.media?.hero,'media.hero');
  if(p?.media?.ending!==undefined)media(p.media.ending,'media.ending'); // Accepted for older payloads; the new ending has no image slot.
  if(p?.media?.features!==undefined){
    if(!Array.isArray(p.media.features)||p.media.features.length!==3)errors.push('media.features: exactly three image slots required');
    else p.media.features.forEach((m,i)=>media(m,`media.features[${i}]`));
  }else media(p?.media?.feature,'media.feature'); // Backward-compatible single-image payloads.
  if(!Array.isArray(p?.cards)||p.cards.length!==9)errors.push('cards: exactly nine independent cards required');
  else p.cards.forEach((c,i)=>{str(c.title,`cards[${i}].title`,34);str(c.subtitle,`cards[${i}].subtitle`,48);media(c.media,`cards[${i}].media`);});
  return errors;
}
export function assertPayload(p) {
  const errors=validatePayload(p);if(errors.length)throw new Error(errors.join('\n'));
  return structuredClone(p);
}
