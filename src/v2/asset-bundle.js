import {sourceRegion,fitRect} from './model.js';

// Associations are supplied by the host product, never guessed from proximity
// in its global image gallery. Older sources still get a single honest anchor.
export function assetBundle(plan){
  if(plan.source.bundle)return plan.source.bundle;
  const p=plan.source,m=p.homepage,h=m.hover;
  if(h)return {assetId:'homepage-item',label:'Selected app item',anchor:h,media:{...m,region:h,hover:undefined},related:[]};
  const f=plan.selected[0];
  return {assetId:f.id,label:f.name,media:f.media,related:[]};
}
export function assetHome(media){
  const r=sourceRegion(media),wide=r.width/r.height>1.3;
  return fitRect(r,{x:wide?310:350,y:131,width:wide?340:260,height:278});
}
// Four readable satellites, with complete silhouettes and breathing room
// around the clicked item. Slot IDs retain the existing motion/editor tracks.
export const BUNDLE_SLOTS=Object.freeze([
  {id:3,x:690,y:205,width:208,height:260},
  {id:1,x:76,y:40,width:210,height:264},
  {id:4,x:176,y:334,width:164,height:164},
  {id:2,x:646,y:42,width:236,height:136}
].map(Object.freeze));
export function bundleVisuals(bundle){
  const seen=new Set(),key=m=>{const r=sourceRegion(m);return JSON.stringify([m.src,r.x,r.y,r.width,r.height]);};
  seen.add(key(bundle.media));
  return bundle.related.filter(item=>{
    // Accept old payloads, but do not turn their facts into arbitrary tiles.
    if(!item.media)return false;
    const r=sourceRegion(item.media),ratio=r.width/r.height,k=key(item.media);
    // Exclude logo strips, tiny face cutouts and duplicate source regions.
    if(Math.min(r.width,r.height)<120||ratio<.4||ratio>3||seen.has(k))return false;
    seen.add(k);return true;
  }).slice(0,BUNDLE_SLOTS.length);
}
export function bundlePose(base,pose,home,movement){
  // Retarget the measured translation/scale about each panel's center.
  // The new, larger panels must stay whole even during the entry overshoot.
  const scale=Math.min(920/base.width,500/base.height,Math.max(0,1+(pose[2]/home[2]-1)*movement));
  const width=base.width*scale,height=base.height*scale;
  return {x:Math.max(20,Math.min(940-width,base.x+(base.width-width)/2+(pose[0]-home[0])*.7*movement)),y:Math.max(20,Math.min(520-height,base.y+(base.height-height)/2+(pose[1]-home[1])*.7*movement)),width,height};
}
export function anchorOnPage(anchor,region,box){
  if(!anchor)return null;
  if(anchor.x<region.x||anchor.y<region.y||anchor.x+anchor.width>region.x+region.width+.01||anchor.y+anchor.height>region.y+region.height+.01)return null;
  const f=fitRect(region,box);
  return {x:f.x+(anchor.x-region.x)*f.scale,y:f.y+(anchor.y-region.y)*f.scale,width:anchor.width*f.scale,height:anchor.height*f.scale};
}
// Stop with the complete selected item visible. An explicit zero scroll stays
// zero; a target outside that viewport is not falsely clicked or lifted.
export function assetScrollProgress(homepage,bundle,requested,windowHeight){
  const r=sourceRegion(homepage),travel=r.height-windowHeight;
  if(travel<=0||!bundle.anchor||requested===0)return Math.max(0,Math.min(1,requested));
  const a=bundle.anchor,min=Math.max(0,(a.y+a.height-r.y-windowHeight)/travel),max=Math.min(1,(a.y-r.y)/travel);
  if(min>max)return Math.max(0,Math.min(1,requested)); // An oversized item cannot be fully clicked in this viewport.
  return Math.max(min,Math.min(max,requested));
}
export function blendBox(a,b,t){return Object.fromEntries(['x','y','width','height'].map(k=>[k,a[k]+(b[k]-a[k])*t]));}
