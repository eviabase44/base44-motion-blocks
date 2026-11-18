import test from 'node:test';
import assert from 'node:assert/strict';
import {endcardPose} from '../src/v2/endcard-motion.js';

test('ending samples the native glyph contraction and letter substitutions at 12 fps',()=>{
  assert.equal(endcardPose(9).phase,'credit');
  assert.deepEqual([10,11,12,13,14,15].map(f=>endcardPose(f).sourceFrame),[1280,1282,1284,1286,1288,1290]);
  assert.deepEqual(endcardPose(10).items.map(i=>i.name),['sentinel','knot','sprout','bloom','arrow','click','frame']);
  assert.equal(endcardPose(11).items.length,6);
  assert.equal(endcardPose(12).items[1].name,'B');
  assert.deepEqual(endcardPose(13).items.map(i=>i.name),['sentinel','B','a','arrow','e','4','4']);
  assert.equal(endcardPose(14).items[1].lastFourGap,14);
  assert.equal(endcardPose(15).items[1].lastFourGap,undefined);
});

test('logo build control retains exact resting geometry and a readable final hold',()=>{
  const resting=endcardPose(23).items;
  assert.deepEqual(resting.map(({x,y,width,height})=>({x,y,width,height})),[{x:392,y:253,width:36,height:36},{x:437,y:254,width:131,height:31}]);
  for(let duration=2;duration<=16;duration++){
    for(let f=16;f<24;f++)assert.deepEqual(endcardPose(f,duration).items,resting);
    for(let f=0;f<24;f++){const p=endcardPose(f,duration);assert.ok(p.items.every(i=>i.width>0&&i.height>0));if(p.items.some(i=>i.kind==='symbol'))assert.ok(!p.items.some(i=>i.kind==='mark'));}
  }
});
