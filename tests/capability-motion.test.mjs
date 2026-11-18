import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {capabilityCopy,capabilityOffset,capabilityLayout,connectorBoxes} from '../src/v2/capability-motion.js';
import {planSequence,validateSource} from '../src/v2/model.js';
const fixture=JSON.parse(await readFile(new URL('../examples/v2-wireframe.json',import.meta.url)));

test('capability screens retain separate copy and support older payloads',()=>{
 const p=structuredClone(fixture);p.benefit='Keep marketing moving.';p.benefitFollowup='From first brief to launch day.';
 const plan=planSequence(p);assert.equal(capabilityCopy(plan),p.benefit);assert.equal(capabilityCopy(plan,true),p.benefitFollowup);
 delete p.benefitFollowup;const legacy=planSequence(p);assert.equal(capabilityCopy(legacy,true),legacy.selected[1].title);assert.notEqual(capabilityCopy(legacy),capabilityCopy(legacy,true));
 for(const value of ['',null,42,'x'.repeat(101)])assert.throws(()=>validateSource({...p,benefitFollowup:value}));
});

test('connector columns move oppositely and preserve vertical position across the cut',()=>{
 for(const movement of [0,.5,1,1.5]){
  for(const column of [0,1]){
   assert.equal(capabilityOffset(17,column,movement),capabilityOffset(18,column,movement));
   const positions=Array.from({length:36},(_,f)=>capabilityOffset(f,column,movement));
   positions.slice(1).forEach((y,i)=>assert.ok(column?y>=positions[i]:y<=positions[i]));
   assert.equal(Math.abs(positions.at(-1)-positions[0]),64*movement);
  }
  for(let f=0;f<36;f++)assert.equal(capabilityOffset(f,0,movement)+capabilityOffset(f,1,movement),0);
 }
});

test('different image ratios pack edge to edge with overlapping connector joints',()=>{
 const tiles=[{width:170,height:172},{width:228,height:128},{width:228,height:127},{width:230,height:296},{width:1672,height:944},{width:226,height:102}];
 for(const movement of [0,1,1.5])for(let frame=0;frame<36;frame++){
  const boxes=capabilityLayout(tiles,frame,frame<18?620:10,movement);
  assert.equal(boxes[0].x+boxes[0].width,boxes[1].x);
  boxes.forEach((b,i)=>{
   assert.ok(Math.abs(b.width/b.height-tiles[i].width/tiles[i].height)<1e-10);
   if(i<2)return;
   const previous=boxes[i-2];assert.equal(b.y,previous.y+previous.height);
   const before=connectorBoxes(previous),after=connectorBoxes(b);
   assert.deepEqual(before[2],after[0]);assert.deepEqual(before[3],after[1]);
  });
 }
 // A missing observation must not leave an empty reserved slot.
 tiles[2]=undefined;const boxes=capabilityLayout(tiles,0,10);
 assert.equal(boxes[4].y,boxes[0].y+boxes[0].height);
});
