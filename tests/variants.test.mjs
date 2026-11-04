import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOT_VARIANTS,getVariant,normalizeVariants,encodeVariants,decodeVariants,sourceLocalFrame} from '../src/variants.js';
import {TOTAL_FRAMES,locateFrame} from '../src/contracts.js';

test('four interchangeable layouts per content shot and exactly one fixed ending',()=>{
  for(const shot of ['hook','reveal','collage','focus'])assert.equal(SHOT_VARIANTS[shot].length,4);
  assert.deepEqual(SHOT_VARIANTS.ending.map(v=>v.id),['original']);
  assert.throws(()=>getVariant('ending','poster'));
  assert.throws(()=>getVariant('focus','grid'));
  assert.throws(()=>normalizeVariants({unknown:'original'}));
  assert.equal(TOTAL_FRAMES,180);assert.equal(locateFrame(144).shot.id,'ending');
});
test('layout selections round-trip independently of app content with original defaults',()=>{
  const layouts={hook:'agency-line',reveal:'screen-stage',collage:'file-strip',focus:'six-day'};
  assert.deepEqual(decodeVariants(encodeVariants(layouts)),{...layouts,ending:'original'});
  assert.equal(encodeVariants({}),'');assert.equal(decodeVariants().focus,'original');
  assert.throws(()=>decodeVariants('hook:steps:extra'));
  assert.throws(()=>decodeVariants('ending:wide'));
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
