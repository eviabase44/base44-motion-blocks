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
