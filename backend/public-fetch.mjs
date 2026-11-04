import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import http from 'node:http';
import https from 'node:https';

export class ImportError extends Error {
  constructor(message,status=422,code='IMPORT_FAILED'){super(message);this.status=status;this.code=code;}
}
export function publicURL(input,base){
  let url;try{url=new URL(base?input:/^https?:\/\//i.test(input)?input:`https://${input}`,base);}catch{throw new ImportError('Enter a valid public app URL.',400,'INVALID_URL');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href.length>2048||url.port&&!['80','443'].includes(url.port))throw new ImportError('Use a public HTTP or HTTPS URL without a login or custom port.',400,'INVALID_URL');
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||!host.includes('.')&&!host.includes(':'))throw new ImportError('Local and private network addresses cannot be imported.',400,'PRIVATE_URL');
  url.hash='';return url;
}
export function isPublicAddress(address){
  const ip=address.replace(/^\[|\]$/g,'');
  if(isIP(ip)===4){const [a,b,c]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);}
  // Only global unicast IPv6; exclude special translation, benchmarking and documentation ranges.
  if(isIP(ip)===6){const groups=ip.toLowerCase().split(':'),second=parseInt(groups[1]||'0',16);return /^[23]/i.test(ip)&&!(groups[0]==='2001'&&(second<0x200||second===0xdb8))&&!/^2002:/i.test(ip)&&!/^3fff:/i.test(ip)&&!ip.includes('.');}
  return false;
}
export async function fetchPublic(input,{signal,maxBytes=1_500_000,accept='text/html',redirects=3,followRedirects=true}={}){
  const url=publicURL(String(input)),host=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=isIP(host)?[{address:host,family:isIP(host)}]:await lookup(host,{all:true});
  if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new ImportError('Local and private network addresses cannot be imported.',400,'PRIVATE_URL');
  signal?.throwIfAborted();
  const response=await new Promise((resolve,reject)=>{
    const pinned=addresses[0];
    const req=(url.protocol==='https:'?https:http).get(url,{signal,headers:{'User-Agent':'Base44-Motion-Preview/1.0','Accept':accept,'Accept-Encoding':'identity'},lookup:(_hostname,options,callback)=>options.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family)},res=>{
      if([301,302,303,307,308].includes(res.statusCode)){res.resume();resolve({url:url.href,redirect:res.headers.location});return;}
      if(res.statusCode!==200){res.resume();reject(new ImportError(`The app returned HTTP ${res.statusCode}. Use a public page or provide a developer snapshot.`,422,'PAGE_UNAVAILABLE'));return;}
      const type=String(res.headers['content-type']??'').split(';')[0].toLowerCase();
      if(Number(res.headers['content-length']??0)>maxBytes){res.destroy();reject(new ImportError('The app response is too large to import.'));return;}
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){res.destroy();reject(new ImportError('The app response is too large to import.'));}else chunks.push(chunk);});
      res.on('error',reject);res.on('end',()=>resolve({url:url.href,type,data:Buffer.concat(chunks),cors:Object.fromEntries(Object.entries(res.headers).filter(([key])=>key.startsWith('access-control-')))}));
    });
    const timer=setTimeout(()=>req.destroy(new ImportError('The app took too long to respond. Try again or provide a developer snapshot.',504,'PAGE_TIMEOUT')),12_000);
    req.on('error',reject);req.on('close',()=>clearTimeout(timer));
  });
  if('redirect'in response&&!followRedirects)return response;
  if('redirect'in response){if(!response.redirect||redirects===0)throw new ImportError('The app redirected too many times. Use its final public URL.');return fetchPublic(new URL(response.redirect,url).href,{signal,maxBytes,accept,redirects:redirects-1});}
  return response;
}
