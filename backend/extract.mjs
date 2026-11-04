import {publicURL,fetchPublic,ImportError} from './public-fetch.mjs';
import {isCaptureURL,requireCapture} from './captures.mjs';
import {base44Preview,readPreviewConnection} from './preview-connections.mjs';

const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”'};
export function text(value=''){return String(value).replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(all,key)=>key[0]==='#'?String.fromCodePoint(Math.min(0x10ffff,Math.max(0,parseInt(key.slice(key[1]==='x'?2:1),key[1]==='x'?16:10)||32))):entities[key]??all).replace(/\s+/g,' ').trim();}
function attrs(tag){const result={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))result[m[1].toLowerCase()]=text(m[2]??m[3]??m[4]);return result;}
const unique=values=>[...new Set(values.filter(Boolean))];
function absolute(value,base){try{return publicURL(value,base).href;}catch{return null;}}
export function hexColor(value){
  const s=value.trim();if(/^#[\da-f]{6}$/i.test(s))return s.toLowerCase();if(/^#[\da-f]{3}$/i.test(s))return '#'+s.slice(1).split('').map(c=>c+c).join('').toLowerCase();
  const rgb=/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i.exec(s);if(rgb)return '#'+rgb.slice(1).map(n=>Math.min(255,+n).toString(16).padStart(2,'0')).join('');
  const hsl=/^(?:hsla?\()?\s*([\d.]+)[, ]+([\d.]+)%[, ]+([\d.]+)%/.exec(s);if(hsl){const h=(+hsl[1]%360)/360,sat=+hsl[2]/100,l=+hsl[3]/100;const f=n=>{const k=(n+h*12)%12;return l-sat*Math.min(l,1-l)*Math.max(-1,Math.min(k-3,9-k,1));};return '#'+[0,8,4].map(n=>Math.round(f(n)*255).toString(16).padStart(2,'0')).join('');}return null;
}
export function parseCSS(css,base){
  const colors=[],fonts=[],families=[];
  for(const m of css.matchAll(/(?:--([\w-]+)|\b(background(?:-color)?|color))\s*:\s*([^;{}]+)/gi)){const value=hexColor(m[3]);if(value)colors.push({value,role:m[1]??m[2]});}
  for(const m of css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)){const family=m[1].split(',')[0].replace(/['"]/g,'').trim();if(family&&!family.includes('var(')&&family.length<65)families.push(family);}
  for(const match of css.matchAll(/@font-face\s*\{([^}]+)\}/gi)){const block=match[1],family=/font-family\s*:\s*['"]?([^;'"}]+)/i.exec(block)?.[1].trim();const srcs=[...block.matchAll(/url\(\s*['"]?([^)'"\s]+)/gi)];const src=absolute(srcs[0]?.[1]??'',base);if(family&&src&&srcs.length)fonts.push({family,src,weight:/font-weight\s*:\s*([^;}]+)/i.exec(block)?.[1].trim()??'400',latin:!block.includes('unicode-range')||/U\+0{0,3}0-0?FF/i.test(block)});}
  return {colors,fonts,families};
}
export function parsePage(html,url){
  const meta={};for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if(a.name||a.property)meta[a.name??a.property]=a.content??'';}
  const title=text(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]);
  const clean=html.replace(/<(script|style|svg|nav|footer|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
  const headings=[...clean.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(m=>text(m[1])).filter(Boolean).slice(0,24);
  const images=[];
  const addImage=(src,alt)=>{const resolved=absolute(src??'',url);if(!src||!resolved)return;const filename=decodeURIComponent(new URL(resolved).pathname.split('/').pop()??'').slice(0,100);if(/(?:^|[\W_])(bg|background|texture|noise|grain|logo|icon|sprite)(?:[\W_]|$)/i.test(filename+' '+(alt??'')))return;if(!images.some(i=>i.src===resolved)&&!/[.](svg|gif)(?:\?|$)/i.test(resolved))images.push({src:resolved,label:text(alt).slice(0,100)||filename.replace(/[-_]/g,' ').replace(/\.[a-z0-9]+$/i,'')||'App image',filename});};
  addImage(meta['og:image'],meta['og:image:alt']??'Social preview');
  for(const m of clean.matchAll(/<img\b[^>]*>/gi)){const a=attrs(m[0]);if(a.width&&+a.width<100||a.height&&+a.height<80)continue;addImage(a.src??a['data-src'],a.alt);}
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
  return {url,name:(meta['og:site_name']??meta['application-name']??title.split(/[|–—]/)[0]??'').trim().slice(0,100),title,description:meta.description??meta['og:description']??'',headings,text:text(clean).slice(0,14000),images:images.slice(0,18),themeColor:hexColor(meta['theme-color']??''),inlineCSS:[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n'),stylesheets:links.filter(a=>a.rel==='stylesheet').map(a=>absolute(a.href,url)).filter(Boolean).slice(0,5)};
}
export async function extractApp(url,{signal,fetcher=fetchPublic,connectionReader=readPreviewConnection}={}){
  const preview=base44Preview(url);
  const connected=await connectionReader(preview?.url??url);
  if(connected)return {...validateSnapshot(connected.snapshot),method:'connected-preview',capturedAt:connected.capturedAt,warnings:['Using saved preview content. Reconnect after changing the app.']};
  if(preview){
    throw new ImportError('This is a Base44 editor link. Connect its signed-in preview with screen captures, or paste the app’s live website link.',422,'PREVIEW_CONNECTION_REQUIRED');
  }
  const page=await fetcher(publicURL(url).href,{signal});
  if(page.type==='application/json'){let snapshot;try{snapshot=JSON.parse(page.data.toString('utf8'));}catch{throw new ImportError('The app snapshot URL returned invalid JSON.');}return validateSnapshot(snapshot);}
  if(!['text/html','application/xhtml+xml'].includes(page.type))throw new ImportError('This URL is not an app page. Paste the public app homepage.',422,'NOT_HTML');
  const source=parsePage(page.data.toString('utf8'),page.url),warnings=[];
  const manifest=[...page.data.toString('utf8').matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a.rel==='base44-motion');
  if(manifest?.href){const exported=await fetcher(publicURL(manifest.href,page.url).href,{signal,accept:'application/json',maxBytes:100_000});let snapshot;try{snapshot=JSON.parse(exported.data.toString('utf8'));}catch{throw new ImportError('The app motion snapshot is invalid JSON.');}return validateSnapshot(snapshot);}
  if(source.text.length<100&&source.description.length<70)throw new ImportError('This app does not expose enough readable content. It may require a login or browser rendering. Developers can send an app snapshot to /api/generate.',422,'SNAPSHOT_REQUIRED');
  const styles=[{css:source.inlineCSS,url:source.url}];
  const sheets=await Promise.allSettled(source.stylesheets.map(async url=>{const r=await fetcher(url,{signal,accept:'text/css',maxBytes:600_000});if(!['text/css','text/plain'].includes(r.type))throw Error('Not CSS');return {css:r.data.toString('utf8'),url:r.url};}));
  for(const r of sheets)if(r.status==='fulfilled')styles.push(r.value);else warnings.push('A stylesheet could not be read; some brand details may need adjustment.');
  const parsed=styles.map(s=>parseCSS(s.css,s.url));
  let colors=parsed.flatMap(s=>s.colors);if(source.themeColor)colors.unshift({value:source.themeColor,role:'theme-color'});
  colors.sort((a,b)=>Number(/primary|brand|accent|theme-color/.test(b.role))-Number(/primary|brand|accent|theme-color/.test(a.role)));
  colors=colors.filter((c,i,a)=>a.findIndex(v=>v.value===c.value)===i).slice(0,24);
  const families=unique(parsed.flatMap(s=>s.families));
  const fonts=parsed.flatMap(s=>s.fonts).sort((a,b)=>Number(b.latin)-Number(a.latin)||Number(/600|100 900|400 700/.test(b.weight))-Number(/600|100 900|400 700/.test(a.weight))).filter((f,i,a)=>a.findIndex(v=>v.family===f.family)===i).slice(0,8);
  if(!colors.length)warnings.push('No brand colors found. The editable Base44 palette is used.');
  if(!fonts.length)warnings.push('No usable app font file found. Dazzed Semibold is used; you can replace it.');
  if(!source.images.length)warnings.push('No public app images found. Media slots use labeled color blocks.');
  return {...source,inlineCSS:undefined,stylesheets:undefined,colors,fonts,families,warnings:unique(warnings),method:'public-html'};
}

// Product integrations pass only content the current app user is authorized to use.
export function validateSnapshot(input){
  if(!input||typeof input!=='object')throw new ImportError('snapshot must be an object.',400);
  for(const key of ['images','colors','fonts','headings'])if(input[key]!==undefined&&!Array.isArray(input[key]))throw new ImportError(`snapshot.${key} must be an array.`,400);
  const url=publicURL(input.url).href;
  if(typeof input.name!=='string'||!input.name.trim()||typeof input.text!=='string'||input.text.length<100)throw new ImportError('A snapshot needs url, name and at least 100 characters of app content.',400);
  const strings=(value,max)=>Array.isArray(value)?value.filter(s=>typeof s==='string').slice(0,max).map(s=>text(s).slice(0,200)):[];
  return {url,name:text(input.name).slice(0,100),title:text(input.name),description:text(input.description).slice(0,500),text:text(input.text).slice(0,14000),headings:strings(input.headings,24),images:(input.images??[]).slice(0,18).map(i=>({src:isCaptureURL(i.src)?requireCapture(i.src):publicURL(i.src,url).href,label:text(i.label).slice(0,100),...(i.kind==='screen'?{kind:'screen'}:{})})),colors:(input.colors??[]).slice(0,24).map(c=>{const value=hexColor(c.value??'');if(!value)throw new ImportError('Snapshot colors must be CSS hex, RGB or HSL values.',400);return {value,role:text(c.role).slice(0,40)};}),fonts:(input.fonts??[]).slice(0,8).map(f=>({family:text(f.family).slice(0,64),src:publicURL(f.src,url).href,weight:String(f.weight??600).slice(0,12)})),families:[],warnings:[],method:'developer-snapshot'};
}
