import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ImportError,publicURL} from './public-fetch.mjs';

const directory=fileURLToPath(new URL('../.cache/previews/',import.meta.url));
export function base44Preview(input){
  let url;try{url=new URL(input);}catch{return null;}
  if(url.origin!=='https://app.base44.com')return null;
  const match=/^\/apps\/([a-f0-9]{24})(?:\/|$)/i.exec(url.pathname);
  if(!match)return null;
  return {appId:match[1].toLowerCase(),url:`https://app.base44.com/apps/${match[1].toLowerCase()}/editor/preview`};
}
function connectionRef(input){
  const base44=base44Preview(input);if(base44)return base44;
  try{const url=publicURL(input);if([...url.searchParams.keys()].some(key=>/token|auth|secret|password|credential|signature|api.?key/i.test(key)))return null;return {url:url.href,appId:'web-'+createHash('sha256').update(url.href).digest('hex')};}catch{return null;}
}
export async function readPreviewConnection(input,{root=directory}={}){
  const ref=connectionRef(input);if(!ref)return null;
  try{const saved=JSON.parse(await readFile(join(root,ref.appId+'.json'),'utf8'));if(saved.version!==1||saved.appId!==ref.appId||!saved.snapshot)return null;return saved;}
  catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return null;throw error;}
}
// Accept a validated, deliberately selected app snapshot. Never browser cookies or iframe tokens.
export async function savePreviewConnection(input,snapshot,{root=directory}={}){
  const ref=connectionRef(input);if(!ref)throw new ImportError('Use the website or app link without login credentials.',400,'INVALID_PREVIEW_URL');
  const scrubURL=value=>{if(!value)return value;const url=new URL(value,'http://localhost');if([...url.searchParams.keys()].some(key=>/token|auth|secret|password|credential|signature|api.?key/i.test(key)))throw new ImportError('Preview connections must not contain login tokens. Use public asset URLs or wireframe blocks.',400,'PREVIEW_CREDENTIALS');return value;};
  for(const image of snapshot.images??[])scrubURL(image.src);for(const font of snapshot.fonts??[])scrubURL(font.src);
  const safe=structuredClone(snapshot);safe.url=ref.url;
  const record={version:1,appId:ref.appId,capturedAt:new Date().toISOString(),snapshot:safe};
  await mkdir(root,{recursive:true});await writeFile(join(root,ref.appId+'.json'),JSON.stringify(record,null,2),{mode:0o600});return record;
}
