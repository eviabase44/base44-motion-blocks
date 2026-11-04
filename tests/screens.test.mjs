import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {saveCapture,readCapture,isCaptureURL,capturePath,requireCapture} from '../backend/captures.mjs';
import {readURLSource} from '../backend/url-source.mjs';
import {savePreviewConnection,readPreviewConnection} from '../backend/preview-connections.mjs';
import {initialWireframe,mediaSources} from '../src/media.js';
import {makeProfile} from '../src/data/profiles.js';

test('local captures are content-addressed, persist bytes, reject other files and cannot traverse paths',async()=>{
  const root=await mkdtemp(join(tmpdir(),'capture-test-'));
  try{
    const bytes=Buffer.alloc(40);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.write('IHDR',12);bytes.writeUInt32BE(1440,16);bytes.writeUInt32BE(900,20);
    const first=await saveCapture(bytes,{root}),second=await saveCapture(bytes,{root});assert.equal(first.src,second.src);assert(isCaptureURL(first.src));assert.equal(requireCapture(first.src,{root}),first.src);assert.deepEqual(await readCapture(first.src,{root}),bytes);
    for(const value of ['/api/captures/../../secret','file:///etc/passwd','/api/captures/abc.png'])assert.throws(()=>capturePath(value,{root}));
    await assert.rejects(saveCapture(Buffer.from('<svg onload="alert(1)"></svg>'),{root}),e=>e.code==='INVALID_CAPTURE');
    assert.throws(()=>requireCapture('/api/captures/'+'0'.repeat(64)+'.png',{root}),e=>e.code==='CAPTURE_MISSING');
  }finally{await rm(root,{recursive:true,force:true});}
});
test('public HTML and JavaScript-only URLs both pass through rendered screen capture',async()=>{
  for(const htmlOnly of [true,false]){
    let renders=0;const result=await readURLSource('https://other-product.example',{extract:async()=>{if(!htmlOnly)throw Object.assign(Error(),{code:'SNAPSHOT_REQUIRED'});return {method:'public-html'};},render:async()=>{renders++;return {method:'rendered-page',images:[{kind:'screen'}]};}});
    assert.equal(renders,1);assert.equal(result.images[0].kind,'screen');
  }
});
test('saved connections are not anonymously re-captured; blocked URLs never enter rendering',async()=>{
  const render=async()=>{throw Error('Must not render');};
  assert.equal((await readURLSource('https://example.com',{extract:async()=>({method:'connected-preview'}),render})).method,'connected-preview');
  await assert.rejects(readURLSource('http://127.1',{extract:async()=>{throw Object.assign(Error(),{code:'PRIVATE_URL'});},render}),e=>e.code==='PRIVATE_URL');
});
test('authorized preview connections also support non-Base44 domains and stay URL-specific',async()=>{
  const root=await mkdtemp(join(tmpdir(),'generic-preview-'));
  try{const snapshot={name:'Other app',url:'https://example.com/workspace',text:'App interface'};await savePreviewConnection(snapshot.url,snapshot,{root});assert.equal((await readPreviewConnection(snapshot.url,{root})).snapshot.name,'Other app');assert.equal(await readPreviewConnection('https://example.com/other',{root}),null);await assert.rejects(savePreviewConnection('https://example.com/?token=secret',snapshot,{root}));}finally{await rm(root,{recursive:true,force:true});}
});
test('imported screens display by default; explicit wireframe choice and sample mode round-trip',()=>{
  const p=makeProfile('wireframe');assert(initialWireframe(p,{imported:true}));p.media.hero.src='/api/captures/'+'a'.repeat(64)+'.png';assert.equal(initialWireframe(p,{imported:true}),false);assert.equal(initialWireframe(p,{imported:true,setting:'1'}),true);assert.equal(initialWireframe(p,{imported:false}),true);assert.equal(initialWireframe(p,{setting:'0'}),false);assert.equal(mediaSources(p).length,1);
});
