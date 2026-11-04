import {extractApp} from './extract.mjs';
import {renderURL} from './render-url.mjs';

// Every public web page gets a rendered capture, even if its initial HTML has copy.
// Signed-in preview connections and explicit developer manifests remain authoritative.
export async function readURLSource(url,{signal,onProgress=()=>{},extract=extractApp,render=renderURL}={}){
  let source;
  try{source=await extract(url,{signal});}
  catch(error){if(error.code!=='SNAPSHOT_REQUIRED')throw error;}
  if(source&&source.method!=='public-html')return source;
  onProgress('Rendering the website and capturing its real screens…');
  return render(url,{signal,source});
}
