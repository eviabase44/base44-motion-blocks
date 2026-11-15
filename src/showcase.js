// V2 is an extension of the original payload, editor, shot renderers and clock.
import {BEATS,planSequence,scrollRegion} from './v2/model.js';
import {renderClickIn} from './v2/render.js';
import {makeProfile} from './data/profiles.js';
export const SHOWCASE_SHOTS=BEATS.map(b=>({...b,description:({hook:'Click into the app, then reveal its description. Source reference: 0:00–0:06.',reveal:'Scroll through the connected homepage inside the existing reveal layout.',collage:'The original card paths introduce the selected feature bundle.',focus:'First selected feature, with its own title and app visual.',focus2:'Second selected feature, with its own title and app visual.',focus3:'Third selected feature, with its own title and app visual.',ending:'Proudly built on, with the official Base44 logo.'})[b.id]}));
export const baseShot=id=>id==='focus2'||id==='focus3'?'focus':id;
export const playbackShots=p=>p.showcase?SHOWCASE_SHOTS:null;
const slot=m=>({...m,label:(m.label??'App screen').slice(0,32),fit:'contain'});
function groups(title,n,max){const words=title.split(/\s+/),out=Array(n).fill('');for(let i=0;i<words.length;i++){const at=Math.min(n-1,Math.floor(i*n/words.length));out[at]+=(out[at]?' ':'')+words[i];}return out.map(w=>w.slice(0,max));}
export function payloadFromShowcase(source){
  const plan=planSequence(source),p=makeProfile('wireframe');
  p.app={name:source.app.name.slice(0,24),kind:source.app.kind??'app'};p.theme={...p.theme,...source.theme};p.typography=source.typography;
  p.copy.hook=groups(source.description,6,22).map(x=>x||' ');
  // Existing editable grouped copy remains available for every original layout.
  p.copy.reveal=['Your','app','All','in','view.'];p.copy.focus=['Explore','your','app','features.'];p.copy.category='APP SHOWCASE';p.copy.detail='APP FEATURES';if(source.copy)p.copy={...p.copy,...source.copy};
  p.media.hero=slot({...source.homepage,label:source.app.name});p.media.features=plan.selected.map(f=>slot({...f.media,label:f.name}));
  p.cards=Array.from({length:9},(_,i)=>{const f=plan.selected[i%3];return {title:f.name.slice(0,34),subtitle:f.title.slice(0,48),media:slot({...f.media,label:f.name})};});
  p.showcase=source;return p;
}
export function syncShowcase(p){
  if(!p.showcase)return null;
  const source={...p.showcase,app:p.app,theme:p.theme,typography:p.typography};
  return planSequence(source);
}
export function renderShowcase(id,frame,p,o,renderers){
  const plan=syncShowcase(p),base=baseShot(id),variant=o.variant??'original';
  if(base==='hook'&&variant==='original')return renderClickIn(plan,frame/71,o.wireframe);
  const q=structuredClone(p);if(base==='hook')q.copy.hook=groups(plan.source.description,6,30);q.media.hero=slot({...plan.source.homepage,label:p.app.name});
  if(base==='reveal'){
    q.media.hero.region=scrollRegion(plan.source.homepage,Math.max(0,Math.min(1,(frame-5)/25)));
    q.media.hero.motionFrame=frame;q.media.hero.interaction=false;
  }
  if(base==='collage')q.cards=p.cards.map((c,i)=>{const f=plan.selected[i%3];return {...c,title:f.name,subtitle:f.title,media:slot({...f.media,label:f.name})};});
  if(base==='focus'){
    const index=id==='focus2'?1:id==='focus3'?2:0,f=plan.selected[index];
    const words=f.title.split(/\s+/);q.copy.focus=words.length===3?[words[0],words[1],'',words[2]]:words.length===2?[words[0],'','',words[1]]:groups(f.title,4,30);q.copy.detail=f.name;q.media.features=[slot({...f.media,label:f.name,motionFrame:frame,interaction:true})];
    o={...o,featureNumber:index+1};
  }
  const mapped=base==='focus'?frame+8:base==='collage'?Math.min(25,frame):Math.min(base==='hook'?35:1000,frame);
  return renderers[base](mapped,q,{...o,variant});
}

export async function addShowcaseToPayload(payload){
  const media=[...(payload.media.features??[]),...payload.cards.map(c=>({...c.media,label:c.title}))];
  const unique=[...new Map(media.filter(m=>m.src).map(m=>[m.src,m])).values()];
  if(unique.length<3)throw Error('V2 needs three distinct feature visuals. Connect more app screens before generating this sequence.');
  async function observe(m){const img=new Image();img.src=m.src;await img.decode().catch(()=>{throw Error('An app screen could not load. Reconnect the preview.');});return {...m,width:img.naturalWidth,height:img.naturalHeight};}
  const homepage=await observe(payload.media.hero);homepage.windowHeight=Math.round(homepage.height*.78);
  const features=await Promise.all(unique.slice(0,8).map(async(m,i)=>({id:`feature-${i+1}`,family:`feature-${i+1}`,name:m.label,title:m.label,media:await observe(m),signals:{credits:120-i*10,visualRichness:70,viewport:.7}})));
  const source={version:2,signalMode:'simulated',app:payload.app,theme:payload.theme,typography:payload.typography,description:payload.copy.hook.join(' '),homepage,features};
  const next=structuredClone(payload);next.showcase=source;return next;
}
