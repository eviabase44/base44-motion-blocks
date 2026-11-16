function bundleMedia(p){return p.showcase?.bundle?[p.showcase.bundle.media,...p.showcase.bundle.related.map(i=>i.media).filter(Boolean)]:[];}
export function mediaSources(payload){return [...new Set([payload.media.hero,...bundleMedia(payload),...(payload.showcase?.images??[]),...(payload.showcase?.features??[]).filter(f=>f.available!==false).flatMap(f=>[f.media,f.page].filter(Boolean)),...(payload.media.features??[payload.media.feature]),...payload.cards.map(c=>c.media)].filter(Boolean).map(m=>m.src).filter(Boolean))];}
export function initialWireframe(payload,{imported=false,setting=null}={}){return setting!==null?setting==='1':!(imported&&mediaSources(payload).length);}
// Check real image bytes before committing an import. A broken image must never
// be reported as a successful app screen with just its background rectangle.
export async function preloadMedia(payload){
  const sources=mediaSources(payload);
  if(!sources.length)throw Error('No app screens were captured. Connect the app with screenshots before generating the video.');
  await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>reject(Error('An app screen took too long to load. Reconnect its captures and try again.')),15000);
    img.onload=()=>{clearTimeout(timer);const slots=[payload.media.hero,...bundleMedia(payload),...(payload.showcase?.images??[]),...(payload.showcase?.features??[]).flatMap(f=>[f.media,f.page].filter(Boolean)),...(payload.media.features??[]),...payload.cards.map(c=>c.media)];if(slots.some(m=>m?.src===src&&m.width&&m.height&&(m.width!==img.naturalWidth||m.height!==img.naturalHeight))){reject(Error('An app screen changed dimensions. Reconnect its media geometry.'));return;}resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('An app screen could not load. Reconnect its captures and try again.'));};img.src=src;
  })));
}
