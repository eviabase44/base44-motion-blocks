import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOTS,TOTAL_FRAMES,locateFrame,clampFrame,validatePayload,safeAssetURL,getFeatureMedia} from '../src/contracts.js';
import {makeProfile as buildProfile} from '../src/data/profiles.js';
const makeProfile=id=>buildProfile(id,'https://example.test/assets/');
import {CARD_TRACKS} from '../src/data/collage.js';
import {endingTitleOffset,authoredOffset,featureScroll} from '../src/motion.js';
test('15-second sequence changes shots at exact source frame boundaries',()=>{
  assert.equal(TOTAL_FRAMES,180);
  for(const [frame,shot,local]of [[0,'hook',0],[35,'hook',35],[36,'reveal',0],[71,'reveal',35],[72,'collage',0],[97,'collage',25],[98,'focus',0],[143,'focus',45],[144,'ending',0],[179,'ending',35],[180,'ending',35]]){const r=locateFrame(frame);assert.equal(r.shot.id,shot);assert.equal(r.frame,local);}
});
test('shots can be independently sequenced and sought',()=>{assert.equal(locateFrame(36,['ending','hook']).shot.id,'hook');assert.equal(locateFrame(35,['ending']).frame,35);assert.throws(()=>locateFrame(0,[]));assert.throws(()=>clampFrame(NaN,36));});
test('every demo app meets the shared content contract',()=>{for(const id of ['wireframe','forma','atlas'])assert.deepEqual(validatePayload(makeProfile(id)),[]);});
test('malformed app payloads and executable URLs are rejected',()=>{const p=makeProfile();p.cards.pop();p.copy.hook[1]='a'.repeat(100);p.media.hero.src='javascript:alert(1)';p.typography.src='data:text/html,abc';assert.equal(validatePayload(p).length,4);for(const url of ['javascript:alert(1)','data:text/html,x','//evil.test/a',''])assert.equal(safeAssetURL(url),false);});
test('nine measured card paths cover every frame and preserve holds',()=>{assert.equal(Object.keys(CARD_TRACKS).length,9);for(const track of Object.values(CARD_TRACKS)){assert.equal(track.samples.length,26);for(const box of track.samples)if(box){assert.equal(box.length,4);assert(box.every(Number.isFinite));assert(box[2]>0&&box[3]>0);}}assert.deepEqual(CARD_TRACKS.card1.samples[0],CARD_TRACKS.card1.samples[1]);});
test('rebuilt ending reveals the title in order and holds both lines through the last frame',()=>{assert.equal(endingTitleOffset(1,0),null);assert.equal(endingTitleOffset(4,1),null);assert(endingTitleOffset(2,0)>0);assert(endingTitleOffset(5,1)>0);for(let f=7;f<36;f++)for(let line=0;line<2;line++)assert.equal(endingTitleOffset(f,line),0);});
test('opening retains authored held offsets',()=>{assert.deepEqual(authoredOffset(1,0,[-101,0]),[-50.5,0]);assert.deepEqual(authoredOffset(2,0,[-101,0]),[-7.5,0]);assert.equal(authoredOffset(1,1,[19,0]),null);});
test('feature gallery holds all three images and scrolls forward without overshoot',()=>{
  const offsets=Array.from({length:46},(_,frame)=>featureScroll(frame));
  assert(offsets.every((v,i)=>v>=0&&v<=2&&(i===0||v>=offsets[i-1])));
  for(const [start,end,slide] of [[11,21,0],[25,33,1],[37,45,2]])for(let frame=start;frame<=end;frame++)assert.equal(offsets[frame],slide);
  assert(offsets[23]>0&&offsets[23]<1);assert(offsets[35]>1&&offsets[35]<2);
  for(let frame=0;frame<46;frame++)assert.equal(featureScroll(frame,1),0);
});
test('feature payloads require three valid images and still support a legacy single image',()=>{
  const p=makeProfile();assert.equal(getFeatureMedia(p).length,3);
  p.media.features[2].src='javascript:bad()';assert(validatePayload(p).some(e=>e.includes('media.features[2].src')));
  p.media.features.pop();assert(validatePayload(p).some(e=>e.includes('exactly three')));
  p.media.feature=p.media.features[0];delete p.media.features;
  assert.deepEqual(validatePayload(p),[]);assert.deepEqual(getFeatureMedia(p),[p.media.feature]);
});
