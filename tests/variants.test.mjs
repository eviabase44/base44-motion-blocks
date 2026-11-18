import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOT_VARIANTS,RETAINED_LAYOUTS,getVariant,normalizeVariants,encodeVariants,decodeVariants,sourceLocalFrame} from '../src/variants.js';
import {TOTAL_FRAMES,locateFrame} from '../src/contracts.js';

test('editor and planner expose exactly one saved layout per card',()=>{
  for(const [shot,variants] of Object.entries(SHOT_VARIANTS))assert.deepEqual(variants.map(v=>v.id),[RETAINED_LAYOUTS[shot]]);
  assert.deepEqual(SHOT_VARIANTS.ending.map(v=>v.id),['original']);
  assert.throws(()=>getVariant('ending','poster'));
  assert.throws(()=>getVariant('focus','grid'));
  assert.throws(()=>normalizeVariants({unknown:'original'}));
  assert.equal(TOTAL_FRAMES,180);assert.equal(locateFrame(144).shot.id,'ending');
});
test('saved layout selections round-trip independently of app content',()=>{
  const layouts={hook:'original',reveal:'original',collage:'original',focus:'original'};
  assert.deepEqual(decodeVariants(encodeVariants(layouts)),{...layouts,ending:'original'});
  assert.equal(encodeVariants({}),'');assert.equal(decodeVariants().focus,'original');
  assert.throws(()=>decodeVariants('hook:steps:extra'));
  assert.throws(()=>decodeVariants('ending:wide'));
});

test('legacy imports cannot restore removed layouts in the editor or player',()=>{
 const legacy={hook:'agency-line',reveal:'screen-stage',collage:'file-strip',focus:'six-day',focus2:'six-week',focus3:'diagonal-window',capabilities:'original'};
 assert.deepEqual(normalizeVariants(legacy),RETAINED_LAYOUTS);
 assert.equal(decodeVariants('collage:fragment-field').collage,'original');
});

test('every replacement links a specific source and retired layouts reset to originals',()=>{
 for(const [shot,variants] of Object.entries(SHOT_VARIANTS))for(const variant of variants.filter(v=>v.id!=='original')){
  assert.ok(variant.source.frames[1]>variant.source.frames[0]);assert.equal(variant.source.fps,24);
  assert.match(variant.source.clip,/assets\/references\/.+\.mp4$/);
 }
 assert.equal(decodeVariants('hook:steps,reveal:wide,collage:mosaic,focus:triptych').hook,'original');
});

test('source entrances keep elapsed time and only the tail is extended',()=>{
 for(const [shot,variants] of Object.entries(SHOT_VARIANTS))for(const variant of variants.filter(v=>v.source)){
  const length=variant.source.frames[1]-variant.source.frames[0];
  for(let f=0;f<46;f++)assert.equal(sourceLocalFrame(shot,variant.id,f),Math.min(length,f*2));
 }
});
