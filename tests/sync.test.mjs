import test from 'node:test';
import assert from 'node:assert/strict';
import {connectAppSource} from '../src/sync.js';
test('live app changes win over an older initial snapshot',async()=>{
  let resolve,emit,unsubscribed=false;const applied=[];
  const pending=connectAppSource({update:async p=>applied.push(p)},{getSnapshot:()=>new Promise(r=>resolve=r),subscribe:fn=>{emit=fn;return()=>{unsubscribed=true;};}});
  emit({version:'new'});resolve({version:'old'});const disconnect=await pending;
  assert.deepEqual(applied,[{version:'new'}]);disconnect();emit({version:'ignored'});assert(unsubscribed);assert.equal(applied.length,1);
});
test('sync adapter surfaces invalid payloads without an unhandled rejection',async()=>{
  const errors=[];await connectAppSource({update:async()=>{throw new Error('Bad payload');}},{getSnapshot:async()=>({}),onError:e=>errors.push(e.message)});assert.deepEqual(errors,['Bad payload']);
});
