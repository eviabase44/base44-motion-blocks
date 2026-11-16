import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENT_DEFAULTS,resizedElement,validateElements} from '../src/v2/element-settings.js';
import {readFile} from 'node:fs/promises';
import {validateSource} from '../src/v2/model.js';
import {controlsFor,MOTION_SHOTS,MOTION_FIELDS,validateMotion,motionFrame,makeMotionPreset,readMotionPreset,saveMotion,loadMotion} from '../src/v2/motion-settings.js';
const fixture=JSON.parse(await readFile(new URL('../examples/v2-wireframe.json',import.meta.url)));
test('animation settings round-trip without carrying app images into presets',()=>{
 const source=structuredClone(fixture);source.motion={version:1,shots:{hook:{tempo:.65,wordFrames:3,cutType:'dissolve',cutFrames:8},focus3:{hover:9,joinFrames:8,backgroundMotion:.6},ending:{symbolFrames:8}},elements:{focus:{headline:{dx:12.1,dy:-3,sx:1.2,sy:1.2,px:182,py:87}}}};
 const memory=new Map(),storage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)??null};
 saveMotion(storage,source);assert.deepEqual(loadMotion(storage,source),source.motion);
 assert.equal(loadMotion(storage,{...source,app:{name:'Other app'}}),null);
 assert.deepEqual(readMotionPreset(JSON.parse(JSON.stringify(makeMotionPreset(source)))),source.motion);
 assert.equal(JSON.stringify(makeMotionPreset(source)).includes(source.homepage.src),false);
 assert.deepEqual(validateSource(source).motion,source.motion);
});
test('settings reject malformed files, unsupported shots and unsafe numbers',()=>{
 for(const settings of [{version:2,shots:{}},{version:1,shots:{bogus:{}}},{version:1,shots:{hook:{tempo:Infinity}}},{version:1,shots:{hook:{tempo:0}}},{version:1,shots:{ending:{scroll:1}}},{version:1,shots:{hook:{joinFrames:6.5}}},JSON.parse('{"version":1,"shots":{"__proto__":{"tempo":1}}}')])assert.throws(()=>validateMotion(settings));
 assert.throws(()=>readMotionPreset({version:1,motion:{version:1,shots:{}}}));
 for(const id of MOTION_SHOTS)for(const key of controlsFor(id))for(const value of [MOTION_FIELDS[key].min,MOTION_FIELDS[key].max])assert.doesNotThrow(()=>validateMotion({version:1,shots:{[id]:{[key]:value}}}));
});
test('retiming is monotonic and preserves exact endpoints at every speed',()=>{
 for(const speed of [.5,.65,1,1.3,2]){let previous=-1;for(let frame=0;frame<36;frame++){const current=motionFrame(frame,35,speed);assert(current>=previous);previous=current;}assert.equal(motionFrame(0,35,speed),0);assert.equal(motionFrame(35,35,speed),35);}
 assert(motionFrame(12,35,2)>motionFrame(12,35,.5));
});
test('resetting one shot preserves other shot settings; storage errors are surfaced',()=>{
 const motion=validateMotion({version:1,shots:{hook:{tempo:.8},focus:{hover:10}}});delete motion.shots.hook;
 assert.deepEqual(motion.shots.focus,{hover:10});
 assert.throws(()=>saveMotion({setItem(){throw Error('Quota exceeded');}},fixture),/Quota/);
 assert.throws(()=>loadMotion({getItem(){return '{bad';}},fixture));
});

test('cut settings accept each transition and reject invalid choices and durations',()=>{
 for(const cutType of ['cut','dissolve','slide-left','slide-right','wipe'])assert.equal(validateMotion({version:1,shots:{hook:{cutType,cutFrames:8}}}).shots.hook.cutType,cutType);
 for(const value of [{cutType:'zoom'},{cutType:[]},{cutFrames:1},{cutFrames:13},{cutFrames:3.5}])assert.throws(()=>validateMotion({version:1,shots:{hook:value}}));
 assert.throws(()=>validateMotion({version:1,shots:{ending:{cutType:'wipe'}}}));
 assert.deepEqual(validateMotion({version:1,shots:{}}).elements,{});
});
test('resizing keeps the opposite corner fixed after repeated moves and resizes',()=>{
 const b={x:120,y:80,width:200,height:100},s={...ELEMENT_DEFAULTS,dx:21,dy:-10,sx:1.4,sy:.8,px:100,py:60};
 const edge=(v,right,bottom)=>[(right?b.x+b.width:b.x)*v.sx+v.px*(1-v.sx)+v.dx,(bottom?b.y+b.height:b.y)*v.sy+v.py*(1-v.sy)+v.dy];
 for(const corner of ['nw','ne','sw','se']){const right=corner.includes('w'),bottom=corner.includes('n'),before=edge(s,right,bottom),after=resizedElement(b,s,310,130,corner);assert.deepEqual(edge(after,right,bottom),before);assert.equal(after.sx,1.55);assert.equal(after.sy,1.3);}
});
test('element adjustments reject malformed and executable settings',()=>{
 for(const value of [{bad:{}},{hook:{'bad id':{dx:0}}},{hook:{logo:{sx:0}}},{hook:{logo:{dx:Infinity}}},{hook:{logo:{hidden:'yes'}}},{hook:{logo:{onclick:'evil'}}}])assert.throws(()=>validateElements(value));
});
