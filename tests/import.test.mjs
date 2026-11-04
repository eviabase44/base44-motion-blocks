import test from 'node:test';
import assert from 'node:assert/strict';
import {publicURL,isPublicAddress,fetchPublic} from '../backend/public-fetch.mjs';
import {parsePage,parseCSS,hexColor,extractApp,validateSnapshot} from '../backend/extract.mjs';
import {buildTemplate,validatePlan,planningInput} from '../backend/planner.mjs';
import {validatePayload} from '../src/contracts.js';

const html=`<html><head><title>Forma | Pilates</title><meta name="description" content="Find a Pilates class, meet your instructor and book a private session at Forma."><meta name="theme-color" content="#006c3c"><style>:root {--primary:#006c3c; --surface:#fffce9;} @font-face{font-family:'Forma Sans';font-weight:600;src:url('/fonts/forma.woff2')}</style><link rel="stylesheet" href="/app.css"></head><body><nav>IGNORE NAV</nav><h1>Move at your own pace</h1><h2>Reformer Flow</h2><p>Book Pilates classes, private sessions and mat foundations. Choose your instructor, see the studio and reserve your next class.</p><img src="/class.jpg" alt="Reformer class"><script>IGNORE SCRIPT</script></body></html>`;
const source={...parsePage(html,'https://forma.example/'),colors:[{value:'#006c3c',role:'primary'},{value:'#fffce9',role:'surface'}],fonts:[{family:'Forma Sans',src:'https://forma.example/fonts/forma.woff2',weight:'600'}],warnings:[],method:'developer-snapshot'};
const plan={name:'Forma',kind:'app',hook:['I built','an app','that','books','Pilates','classes.'],reveal:['Pilates','classes','And','private','sessions.'],focus:['Book','a','class','today'],category:'Pilates classes',detail:'Reformer Flow · Forma',cards:Array.from({length:9},()=>({title:'Reformer Flow',subtitle:'Book a Pilates class',imageIndex:0})),heroImage:0,featureImages:[0,0,0],featureLabels:['Reformer Flow','Private sessions','Mat foundations'],primaryColor:0,accentColor:0,font:0,layouts:{hook:'dark-statement',reveal:'echo-right',collage:'file-strip',focus:'six-day',ending:'original'},reasons:{hook:'A concise class-booking benefit.',reveal:'The main booking view sits beside the offer.',collage:'Class choices appear in a strip.',focus:'A short booking action beside the class.'}};

test('URL parsing rejects credentials, schemes and local ports',()=>{
  assert.equal(publicURL('base44.com').href,'https://base44.com/');
  for(const value of ['http://localhost','https://a.local','https://a.internal','https://u:p@example.com','http://example.com:8782','file:///etc/passwd','javascript:alert(1)'])assert.throws(()=>publicURL(value),undefined,value);
});
test('network fetch blocks local, metadata, mapped, encoded and reserved addresses',async()=>{
  for(const ip of ['127.0.0.1','10.2.3.4','172.20.0.1','192.168.1.4','169.254.169.254','100.64.1.2','0.0.0.0','198.19.0.1','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::'])assert.equal(isPublicAddress(ip),false,ip);
  for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(isPublicAddress(ip),true,ip);
  for(const url of ['http://127.1','http://2130706433','http://0x7f000001','http://[::1]','http://[::ffff:127.0.0.1]'])await assert.rejects(fetchPublic(url),/private network/);
});
test('HTML extractor reads product content and never includes executable scripts or nav',()=>{
  const page=parsePage(html,'https://forma.example/');assert.equal(page.name,'Forma');assert.deepEqual(page.headings,['Move at your own pace','Reformer Flow']);assert.equal(page.images[0].src,'https://forma.example/class.jpg');assert(!page.text.includes('IGNORE'));assert.equal(page.themeColor,'#006c3c');
  const css=parseCSS(page.inlineCSS,page.url);assert.equal(css.fonts[0].family,'Forma Sans');assert.equal(css.fonts[0].src,'https://forma.example/fonts/forma.woff2');assert.equal(hexColor('120 100% 50%'),'#00ff00');
});
test('an unreadable client-rendered app returns a snapshot requirement',async()=>{
  await assert.rejects(extractApp('https://forma.example',{fetcher:async()=>({url:'https://forma.example',type:'text/html',data:Buffer.from('<html><title>App</title><div id="root"></div></html>')})}),e=>e.code==='SNAPSHOT_REQUIRED');
});
test('stylesheet failures retain factual content and report partial brand extraction',async()=>{
  const extracted=await extractApp('https://forma.example',{fetcher:async url=>{if(url.endsWith('.css'))throw Error('unavailable');return {url,type:'text/html',data:Buffer.from(html)};}});
  assert.equal(extracted.fonts[0].family,'Forma Sans');assert(extracted.warnings.some(w=>w.includes('stylesheet')));
});
test('AI-selected plans produce all slots, app colors and a fixed ending',()=>{
  const result=buildTemplate(source,plan);assert.deepEqual(validatePayload(result.payload),[]);assert.equal(result.payload.theme.primary,'#006c3c');assert.equal(result.payload.typography.family,'Forma Sans');assert.equal(result.variants.ending,'original');assert.equal(result.payload.cards.length,9);assert.equal(result.payload.media.features.length,3);
  const input=planningInput(source);assert(!JSON.stringify(input).includes('https://'));assert.equal(input.SOURCE_DATA.images[0].index,0);
});
test('unavailable assets, invalid layouts, altered ending and invented fields are rejected',()=>{
  for(const change of [p=>p.heroImage=22,p=>p.layouts.ending='six-day',p=>p.layouts.hook='new-design',p=>p.hook[0]='Amazing',p=>p.file='/etc/passwd']){const next=structuredClone(plan);change(next);assert.throws(()=>validatePlan(next,source));}
});
test('a content-only developer snapshot uses explicit editable fallbacks',()=>{
  const snap=validateSnapshot({url:'https://forma.example',name:'Forma',text:source.text});const next=structuredClone(plan);next.heroImage=-1;next.featureImages=[-1,-1,-1];next.cards.forEach(c=>c.imageIndex=-1);next.font=-1;next.primaryColor=-1;next.accentColor=-1;const result=buildTemplate(snap,next);assert.equal(result.payload.media.hero.src,null);assert.equal(result.payload.typography.family,'Dazzed');assert(result.warnings.some(w=>w.includes('Dazzed')));
});

test('an advertised public snapshot supports a JavaScript-only homepage',async()=>{
  const snapshot={url:'https://forma.example',name:'Forma',text:source.text,colors:source.colors};
  const captured=await extractApp('https://forma.example',{fetcher:async url=>url.endsWith('/motion.json')?{url,type:'application/json',data:Buffer.from(JSON.stringify(snapshot))}:{url,type:'text/html',data:Buffer.from('<link rel="base44-motion" href="/motion.json"><div id="root"></div>')}});
  assert.equal(captured.method,'developer-snapshot');assert.equal(captured.name,'Forma');assert.equal(captured.colors[0].value,'#006c3c');
});
test('the planner rejects unrelated writing systems in generated English copy',()=>{
  const bad=structuredClone(plan);bad.detail='Book classes today你';assert.throws(()=>validatePlan(bad,source),/language consistent/);
});

test('decorative background and logo assets cannot become app screens',()=>{
  const page=parsePage('<title>Demo</title><img src="/grow-bg-tablet.webp"><img src="/logo.png" alt="Logo"><img src="/dashboard.png" alt="Project dashboard">','https://demo.example/');
  assert.equal(page.images.length,1);assert.equal(page.images[0].filename,'dashboard.png');assert.equal(page.images[0].label,'Project dashboard');
});
