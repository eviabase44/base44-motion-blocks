import test from 'node:test';
import assert from 'node:assert/strict';
import {arrive,smoother,curvePoint,refinedPreset} from '../src/v2/refined-motion.js';
import {validateMotion,makeMotionPreset,readMotionPreset,playbackCadence} from '../src/v2/motion-settings.js';
import {restoreSavedMotion} from '../src/v2/motion-panel.js';
test('editor initializes refined motion while preserving saved and explicit settings',()=>{
 const fresh=()=>({app:{name:'Test'},showcase:{}}),storage={getItem:()=>null};
 assert.deepEqual(restoreSavedMotion(fresh(),storage).showcase.motion,refinedPreset());
 const saved={version:1,style:'original',shots:{hook:{tempo:.8}},elements:{}};
 const preset=makeMotionPreset({app:{name:'Test'},motion:saved});
 const stored={getItem:()=>JSON.stringify(preset)};
 assert.deepEqual(restoreSavedMotion(fresh(),stored).showcase.motion,saved);
 const explicit=fresh();explicit.showcase.motion=refinedPreset();
 assert.deepEqual(restoreSavedMotion(explicit,stored).showcase.motion,refinedPreset());
 assert.deepEqual(restoreSavedMotion({app:{name:'V1'}},stored),{app:{name:'V1'}});
});
test('refined preset preserves layout edits, validates and survives preset export',()=>{
 const elements={focus:{headline:{dx:2.1,sy:.8}}},motion=refinedPreset(elements);elements.focus.headline.dx=99;
 assert.equal(motion.elements.focus.headline.dx,2.1);assert.deepEqual(validateMotion(motion),motion);
 assert.deepEqual(readMotionPreset(JSON.parse(JSON.stringify(makeMotionPreset({app:{name:'Test'},motion})))),motion);
 assert.equal(playbackCadence({motion}),60);assert.equal(playbackCadence({motion:{version:1,shots:{}}}),12);
 assert.throws(()=>validateMotion({...motion,cadence:59}));assert.throws(()=>validateMotion({...motion,style:'random'}));
});
test('arrival curves have exact endpoints, stay monotonic, and land without a last-frame snap',()=>{
 for(const softness of [0,.32,.5,1]){let last=0;for(let i=0;i<=1000;i++){const v=arrive(i/100,0,10,softness);assert(v>=last-1e-10&&v<=1);last=v;}assert.equal(arrive(-1,0,10,softness),0);assert.equal(arrive(10,0,10,softness),1);assert(1-arrive(9.99,0,10,softness)<.0001);}
 assert.equal(smoother(0),0);assert.equal(smoother(1),1);
});
test('cursor paths start and finish at their targets without endpoint velocity',()=>{
 const a={x:775,y:346},b={x:610,y:277},c={x:718,y:262};assert.deepEqual(curvePoint(a,c,b,0),a);assert.deepEqual(curvePoint(a,c,b,1),b);
 const near=curvePoint(a,c,b,.999);assert(Math.hypot(near.x-b.x,near.y-b.y)<.001);
});
