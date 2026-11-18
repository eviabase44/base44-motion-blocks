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

test('columns pull in opposite directions and preserve position across the cut',()=>{
 for(const movement of [0,.5,1,1.5])for(const column of [0,1]){
  assert.equal(capabilityOffset(17,column,movement),capabilityOffset(18,column,movement));
  const positions=Array.from({length:36},(_,f)=>capabilityOffset(f,column,movement));
  positions.slice(1).forEach((y,i)=>assert.ok(column?y>=positions[i]:y<=positions[i]));
  assert.equal(Math.abs(positions.at(-1)-positions[0]),64*movement);
  for(let f=0;f<36;f++)assert.ok(Math.abs(capabilityOffset(f,0,movement)+capabilityOffset(f,1,movement))<1e-8);
 }
});

test('fixed-width tiles keep source ratios and gutters bridged by shared corner squares',()=>{
 const tiles=[{width:170,height:172},{width:228,height:128},{width:228,height:127},{width:230,height:296},{width:1672,height:944},{width:226,height:102}];
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
 for(const movement of [0,1,1.5])for(let frame=0;frame<36;frame++){
  const baseX=frame<18?555:10,boxes=capabilityLayout(tiles,frame,baseX,movement);
  boxes.forEach((b,i)=>{
   near(b.width,190);near(b.x,baseX+(i%2)*200);
   near(b.width/b.height,tiles[i].width/tiles[i].height);
   if(i>=2){
    const previous=boxes[i-2];near(previous.y+previous.height+10,b.y);
    const lower=connectorBoxes(previous).slice(2),upper=connectorBoxes(b).slice(0,2);
    lower.forEach((g,j)=>{near(g.x,upper[j].x);near(g.y,upper[j].y);});
   }
  });
  near(boxes[1].x-(boxes[0].x+boxes[0].width),10);
  const grips=connectorBoxes(boxes[0]);
  near(grips[0].x+grips[0].width,boxes[0].x);near(grips[0].y+grips[0].height,boxes[0].y);
  near(grips[3].x,boxes[0].x+boxes[0].width);near(grips[3].y,boxes[0].y+boxes[0].height);
  assert.notEqual(boxes[0].height,boxes[1].height);
 }
 // Missing media leaves no vertical hole and keeps surviving tile IDs/columns.
 tiles[2]=undefined;const boxes=capabilityLayout(tiles,0,10);
 near(boxes[4].y,boxes[0].y+boxes[0].height+10);near(boxes[3].y,boxes[1].y+boxes[1].height+10);assert.equal(boxes[2],null);
 const a=capabilityLayout(tiles,0,10),b=capabilityLayout(tiles,35,10);
 a.forEach((box,i)=>{if(box)near(b[i].y-box.y,i%2?64:-64);});
 // A cropped feature uses the selected region's aspect ratio, not the page's.
 const region={x:40,y:30,width:120,height:300};
 const crop=capabilityLayout([{width:1200,height:800,region}],0,10)[0];near(crop.height,475);
});
