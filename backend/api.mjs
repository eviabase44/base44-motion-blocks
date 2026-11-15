import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {fetchPublic,ImportError} from './public-fetch.mjs';
import {extractApp,validateSnapshot} from './extract.mjs';
import {providerStatus,planVideo,buildTemplate} from './planner.mjs';
import {savePreviewConnection,readPreviewConnection} from './preview-connections.mjs';

import {isCaptureURL,requireCapture,saveCapture,readCapture} from './captures.mjs';
import {readURLSource} from './url-source.mjs';

const assets=new Map();let active=0,cacheBytes=0;
const registry=fileURLToPath(new URL('../.cache/assets/',import.meta.url));
function registerAsset(url,kind){
  if(kind==='image'&&isCaptureURL(url))return requireCapture(url);
  const key=createHash('sha256').update(kind+'|'+url).digest('hex').slice(0,32);
  if(!assets.has(key)){if(assets.size>=256){const oldest=assets.keys().next().value;cacheBytes-=assets.get(oldest).data?.length??0;assets.delete(oldest);}assets.set(key,{url,kind});mkdirSync(registry,{recursive:true});writeFileSync(join(registry,key+'.json'),JSON.stringify({url,kind}));}
  return '/api/assets/'+key;
}
function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>100_000)throw new ImportError('Request exceeds the 100 KB limit.',413,'REQUEST_TOO_LARGE');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ImportError('Request must be valid JSON.',400,'INVALID_JSON');}}
export async function generateVideo({url,snapshot,compact=0},{signal,onProgress=()=>{},plan=planVideo}={}){
  onProgress('Reading app content and brand…');
  const source=snapshot?validateSnapshot(snapshot):await readURLSource(url,{signal,onProgress});
  if(!source.images.length)throw new ImportError('No app screens are connected to this link. Connect its preview with screen captures, then generate again.',422,'NO_APP_SCREENS');
  if(source.method==='connected-preview')onProgress(`Loaded saved ${source.name} preview. Choosing cards…`);
  onProgress(`Choosing cards and writing copy for ${source.name||'this app'}…`);
  const result=await plan(source,{signal,compact:Math.max(0,Math.min(2,Number(compact)||0))});
  const sourceAssets={};const template=buildTemplate(source,result.plan,{assetURL:(url,kind)=>{const path=registerAsset(url,kind);sourceAssets[path]={url,kind};return path;}});
  return {...template,sourceAssets,provider:result.provider,duration:15,generatedAt:new Date().toISOString()};
}
export async function handleAPI(req,res,pathname){
  if(!pathname.startsWith('/api/'))return false;
  let streaming=false;
  try{
    // This local preview is not an unauthenticated public AI proxy. Host integrations add their own auth.
    if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)throw new ImportError('Cross-origin requests are not allowed.',403,'ORIGIN_NOT_ALLOWED');
    if(req.headers['sec-fetch-site']==='cross-site')throw new ImportError('Cross-site requests are not allowed.',403,'ORIGIN_NOT_ALLOWED');
    if(pathname==='/api/captures'&&req.method==='POST'){
      if(!['image/png','image/jpeg'].includes(req.headers['content-type']))throw new ImportError('Send a PNG or JPEG screen capture.',415,'CONTENT_TYPE');
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8_000_000)throw new ImportError('Screen capture exceeds 8 MB.',413,'REQUEST_TOO_LARGE');chunks.push(chunk);}
      send(res,201,await saveCapture(Buffer.concat(chunks)));return true;
    }
    if(pathname.startsWith('/api/captures/')&&req.method==='GET'){
      const data=await readCapture(pathname);res.writeHead(200,{'Content-Type':pathname.endsWith('.jpg')?'image/jpeg':'image/png','Content-Length':data.length,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(data);return true;
    }
    if(pathname==='/api/v2/local-source'&&req.method==='GET'){
      try{send(res,200,JSON.parse(readFileSync(new URL('../.cache/v2/source.json',import.meta.url),'utf8')));}
      catch{send(res,404,{error:'No local v2 source configured.'});}
      return true;
    }
    if(pathname==='/api/capabilities'&&req.method==='GET'){send(res,200,await providerStatus());return true;}
    if(pathname==='/api/preview-connections'&&req.method==='GET'){
      const url=new URL(req.url,'http://localhost').searchParams.get('url'),record=await readPreviewConnection(url);
      send(res,200,record?{connected:true,name:record.snapshot.name,capturedAt:record.capturedAt}:{connected:false});return true;
    }
    if(pathname==='/api/preview-connections'&&req.method==='POST'){
      if(!req.headers['content-type']?.startsWith('application/json'))throw new ImportError('Send application/json.',415,'CONTENT_TYPE');
      const input=await body(req),snapshot=validateSnapshot(input?.snapshot),record=await savePreviewConnection(input.url,snapshot);
      send(res,200,{connected:true,name:record.snapshot.name,url:record.snapshot.url,capturedAt:record.capturedAt});return true;
    }
    if(pathname.startsWith('/api/assets/')&&req.method==='GET'){
      const key=pathname.slice('/api/assets/'.length);if(!/^[a-f0-9]{32}$/.test(key))throw new ImportError('Asset not found.',404);
      let item=assets.get(key);if(!item){try{item=JSON.parse(readFileSync(join(registry,key+'.json'),'utf8'));assets.set(key,item);}catch{throw new ImportError('This imported asset expired. Generate the video again.',404,'ASSET_EXPIRED');}}
      if(!item.data){const fetched=await fetchPublic(item.url,{maxBytes:item.kind==='font'?5_000_000:8_000_000,accept:item.kind==='font'?'font/*,*/*;q=0.5':'image/*',signal:AbortSignal.timeout(15000)});
        const valid=item.kind==='font'?/^(font\/|application\/(?:font-|x-font-|octet-stream|vnd\.ms-fontobject))/.test(fetched.type):/^image\/(png|jpeg|webp|avif)$/.test(fetched.type);
        if(!valid)throw new ImportError('The app asset is not a supported image or font.',422,'ASSET_TYPE');
        if(cacheBytes+fetched.data.length>40_000_000){for(const asset of assets.values()){delete asset.data;delete asset.type;}cacheBytes=0;}
        item.data=fetched.data;item.type=fetched.type;cacheBytes+=item.data.length;
      }
      res.writeHead(200,{'Content-Type':item.type,'Content-Length':item.data.length,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(item.data);return true;
    }
    if(pathname!=='/api/generate'||req.method!=='POST'){send(res,404,{error:'API endpoint not found.'});return true;}
    if(!req.headers['content-type']?.startsWith('application/json'))throw new ImportError('Send application/json.',415,'CONTENT_TYPE');
    if(active>=1)throw new ImportError('A video is already being generated. Wait for it to finish or cancel it first.',429,'BUSY');
    const input=await body(req);if(!input||typeof input!=='object'||!input.snapshot&&typeof input.url!=='string')throw new ImportError('Provide a URL or developer snapshot.',400,'INVALID_INPUT');
    const provider=await providerStatus();if(!provider.ready)throw new ImportError('Connect AI first: set OPENAI_API_KEY on the server, or sign in with codex login on this machine.',503,'AI_NOT_CONFIGURED');
    const abort=new AbortController(),signal=AbortSignal.any([abort.signal,AbortSignal.timeout(240_000)]);
    res.on('close',()=>{if(!res.writableEnded)abort.abort();});
    streaming=req.headers.accept==='application/x-ndjson';
    if(streaming)res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    active++;
    try{
      const result=await generateVideo(input,{signal,onProgress:message=>{if(streaming)res.write(JSON.stringify({type:'progress',message})+'\n');}});
      if(streaming)res.end(JSON.stringify({type:'result',result})+'\n');else send(res,200,result);
    }finally{active--;}
  }catch(error){
    const message=error instanceof ImportError?error.message:error.name==='TimeoutError'?'Generation timed out. Please retry.':error.name==='AbortError'?'Generation canceled.':'The app could not be imported. Check that the URL is public and try again.';
    if(!res.destroyed){const result={error:message,code:error.code??'IMPORT_FAILED'};if(streaming)res.end(JSON.stringify({type:'error',...result})+'\n');else send(res,error.status??502,result);}
  }
  return true;
}
