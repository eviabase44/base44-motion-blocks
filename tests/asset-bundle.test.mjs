import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planSequence,sourceRegion,validateSource} from '../src/v2/model.js';
import {assetBundle,assetHome,assetScrollProgress,anchorOnPage} from '../src/v2/asset-bundle.js';
import {homepagePose,pageRegion} from '../src/v2/figma-flow.js';
import {MOTION_DEFAULTS,motionFrame} from '../src/v2/motion-settings.js';
import {payloadFromShowcase} from '../src/showcase.js';
import {mediaSources} from '../src/media.js';
const fixture=JSON.parse(await readFile(new URL('../examples/v2-wireframe.json',import.meta.url)));
const fresh=()=>structuredClone(fixture);
test('bundle accepts only associated assets, valid outlines and source bounds',()=>{
 assert.doesNotThrow(()=>validateSource(fresh()));
 for(const mutate of [p=>p.bundle.related[0].assetId='unrelated',p=>p.bundle.related[0].media.src='javascript:alert(1)',p=>p.bundle.media.cornerRadius=999,p=>p.bundle.media.cornerRadius=-1,p=>p.bundle.anchor.y=99999,p=>p.bundle.related[1].id=p.bundle.related[0].id,p=>p.bundle.related[1].media=p.bundle.media]){
  const p=fresh();mutate(p);assert.throws(()=>validateSource(p));
 }
});
test('legacy sources never fill a bundle from unrelated global imagery',()=>{
 const p=fresh();delete p.bundle;
 assert.deepEqual(assetBundle(planSequence(p)).related,[]);
 p.homepage.hover={x:455,y:430,width:370,height:340};
 const b=assetBundle(planSequence(p));assert.deepEqual(b.media.region,p.homepage.hover);assert.equal(b.media.src,p.homepage.src);assert.deepEqual(b.related,[]);
});
test('portrait, landscape and square assets remain whole at the match-cut',()=>{
 for(const [width,height]of [[230,297],[900,300],[400,400]]){
  const m={width:1200,height:1000,region:{x:100,y:100,width,height},cornerRadius:20},r=sourceRegion(m),b=assetHome(m);
  assert.ok(Math.abs(b.width/b.height-r.width/r.height)<1e-10);assert.equal(b.x+b.width/2,480);assert.equal(b.y+b.height/2,270);assert.ok(b.width<=340&&b.height<=278);
 }
});
test('deep scroll stays bounded and lands with the complete selected item visible',()=>{
 const m={width:1672,height:1425,windowHeight:850},b={anchor:{x:846,y:789.5,width:230,height:296.75}};
 for(const requested of [0,.1,.5,1]){
  const progress=assetScrollProgress(m,b,requested,850),r=pageRegion(m,progress);assert.ok(progress>=0&&progress<=1);assert.ok(r.y+r.height<=1425);
  if(requested>0)assert.ok(anchorOnPage(b.anchor,r,{x:90,y:52,width:780,height:426}));
 }
 assert.equal(pageRegion(m,1).y,575);assert.equal(assetScrollProgress(m,b,0,850),0);
 b.anchor.height=1000;assert.equal(assetScrollProgress(m,b,1,850),1);
});
test('retiming preserves the exact homepage-to-bundle asset endpoint',()=>{
 const plan=planSequence(fresh());
 for(const tempo of [.5,1,2]){
  const pose=homepagePose(plan,motionFrame(41,41,tempo),MOTION_DEFAULTS),home=assetHome(plan.source.bundle.media);
  for(const k of ['x','y','width','height'])assert.equal(pose.box[k],home[k]);
  assert.ok(pose.anchor);assert.ok(pose.isolating);
 }
});
test('preloading includes related media even when it is absent from feature screens',()=>{
 const p=fresh();p.bundle.related[0].media.src='/assets/linked-only.png';p.bundle.media.src='/assets/anchor-only.png';
 const urls=mediaSources(payloadFromShowcase(p));assert.ok(urls.includes('/assets/linked-only.png'));assert.ok(urls.includes('/assets/anchor-only.png'));assert.equal(urls.length,new Set(urls).size);
});
