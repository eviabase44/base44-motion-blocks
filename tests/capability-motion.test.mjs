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

test('connected cards share a vertical pull and preserve position across the cut',()=>{
 for(const movement of [0,.5,1,1.5]){
  assert.equal(capabilityOffset(17,movement),capabilityOffset(18,movement));
  const positions=Array.from({length:36},(_,f)=>capabilityOffset(f,movement));
  positions.slice(1).forEach((y,i)=>assert.ok(y<=positions[i]));
  assert.equal(Math.abs(positions.at(-1)-positions[0]),64*movement);
 }
});

test('different image ratios scale into aligned rows with overlapping connector corners',()=>{
 const tiles=[{width:170,height:172},{width:228,height:128},{width:228,height:127},{width:230,height:296},{width:1672,height:944},{width:226,height:102}];
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
 for(const movement of [0,1,1.5])for(let frame=0;frame<36;frame++){
  const baseX=frame<18?620:10,boxes=capabilityLayout(tiles,frame,baseX,movement);
  boxes.forEach((b,i)=>{
   near(b.width/b.height,tiles[i].width/tiles[i].height);
   if(i%2===0){const next=boxes[i+1];near(b.y,next.y);near(b.height,next.height);near(b.x+b.width,next.x);near(b.x,baseX);near(next.x+next.width,baseX+390);}
   if(i>=2)near(boxes[i-2].y+boxes[i-2].height,b.y);
  });
  // Every corner except the four outside corners has an identical partner.
  const joints=boxes.flatMap((b,i)=>connectorBoxes(b).map((g,j)=>({...g,i,j})));
  for(const g of joints){if((g.i===0&&g.j===0)||(g.i===1&&g.j===1)||(g.i===4&&g.j===2)||(g.i===5&&g.j===3))continue;
   assert.ok(joints.some(h=>h.i!==g.i&&Math.abs(g.x-h.x)<1e-8&&Math.abs(g.y-h.y)<1e-8),'Unpaired interior corner');
  }
 }
 // A missing observation must not leave an empty reserved slot.
 tiles[2]=undefined;const boxes=capabilityLayout(tiles,0,10);
 near(boxes[3].y,boxes[0].y+boxes[0].height);near(boxes[3].y,boxes[4].y);assert.equal(boxes[2],null);
 const a=capabilityLayout(tiles,0,10),b=capabilityLayout(tiles,35,10);
 a.forEach((box,i)=>{if(box)near(b[i].y-box.y,-64);});
});
