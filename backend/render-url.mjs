import {chromium} from 'playwright';
import {existsSync} from 'node:fs';
import {fetchPublic,publicURL,ImportError} from './public-fetch.mjs';
import {parseCSS,hexColor} from './extract.mjs';
import {saveCapture} from './captures.mjs';

// Browser requests never go directly to a requested host. The existing fetcher
// validates DNS, pins the connection and rechecks each redirect. No user profile,
// session cookies, form submissions or login credentials enter this browser.
export async function renderURL(input,{signal,source,fetcher=fetchPublic}={}){
  const normalized=publicURL(input);normalized.hash=new URL(/^https?:\/\//i.test(input)?input:'https://'+input).hash;const url=normalized.href;
  let browser;
  try{browser=await chromium.launch({headless:true,chromiumSandbox:true,...(!existsSync(chromium.executablePath())?{channel:'chrome'}:{}),args:['--disable-background-networking','--force-webrtc-ip-handling-policy=disable_non_proxied_udp']});}
  catch{throw new ImportError('Website screen capture is not installed. Run npm run install:browser on the local server, then retry.',503,'RENDERER_UNAVAILABLE');}
  const abort=()=>{void browser.close();};signal?.addEventListener('abort',abort,{once:true});
  const deadline=setTimeout(abort,45000);
  try{
    signal?.throwIfAborted();
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false});
    await context.routeWebSocket('**/*',route=>route.close());
    let requests=0,totalBytes=0;const styles=[];
    await context.route('**/*',async route=>{
      const request=route.request();
      try{
        if(!['GET','HEAD'].includes(request.method())||++requests>350||totalBytes>80_000_000)return await route.abort();
        const response=await fetcher(request.url(),{signal,maxBytes:8_000_000,accept:request.headers().accept??'*/*',followRedirects:false});
        totalBytes+=response.data?.length??0;
        if(response.redirect){publicURL(response.redirect,response.url);return await route.fulfill({status:302,headers:{location:new URL(response.redirect,response.url).href},body:''});}
        if(response.type==='text/css')styles.push({css:response.data.toString('utf8'),url:response.url});
        await route.fulfill({status:200,contentType:response.type,headers:response.cors??{},body:response.data});
      }catch{await route.abort().catch(()=>{});}
    });
    const page=await context.newPage();
    page.on('dialog',dialog=>dialog.dismiss());
    context.on('page',popup=>{if(popup!==page)void popup.close();});
    try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:22000});}
    catch{throw new ImportError('This website could not be opened for capture. Check the link or connect an authorized app preview.',422,'RENDER_FAILED');}
    await page.waitForLoadState('networkidle',{timeout:6500}).catch(()=>{});
    await page.waitForFunction(()=>document.body?.innerText.trim().length>100,{timeout:5000}).catch(()=>{});
    await page.evaluate(()=>document.fonts.ready);
    const content=await page.evaluate(()=>{
      const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
      const root=document.querySelector('main,[role=main]')??document.body,clean=root.cloneNode(true);
      clean.querySelectorAll('script,style,nav,footer,input,textarea,[data-motion-private],[aria-hidden=true]').forEach(el=>el.remove());
      const colors=[],families=[];
      for(const el of [document.body,root,...root.querySelectorAll('h1,h2,button,a')].filter(visible).slice(0,32)){
        const css=getComputedStyle(el);families.push(css.fontFamily.split(',')[0].replace(/['"]/g,''));
        for(const [property,role] of [['backgroundColor',el.matches('button,a')?'primary action':'surface'],['color','text']])if(css[property]!=='rgba(0, 0, 0, 0)')colors.push({value:css[property],role});
      }
      const headings=[...root.querySelectorAll('h1,h2,h3')].filter(visible);
      return {title:document.title,text:clean.textContent.replace(/\s+/g,' ').trim().slice(0,14000),headings:headings.map(el=>el.textContent.trim()).slice(0,24),colors,families,
        password:[...document.querySelectorAll('input[type=password]')].some(visible),bodyText:document.body.innerText.slice(0,500),
        sections:headings.map(el=>({y:Math.max(0,el.getBoundingClientRect().top+scrollY-80),label:el.textContent.trim().slice(0,85)})).filter(x=>x.y>500).slice(0,12),
        height:document.documentElement.scrollHeight,inlineCSS:[...document.querySelectorAll('style')].map(el=>el.textContent).join('\n')};
    });
    if(content.password||content.text.length<800&&/^(sign in|log in|login|welcome.*sign in)/i.test(content.bodyText.trim())||/^(just a moment|access denied|checking your browser|verify (you are|you're) human)/i.test(content.bodyText.trim()))throw new ImportError('This page needs login or human verification. Connect an authorized preview with screen captures.',422,'LOGIN_REQUIRED');
    if(content.text.length<100)throw new ImportError('The rendered page has no readable app content. Connect a preview with app content and screenshots.',422,'SNAPSHOT_REQUIRED');
    const name=source?.name||content.title.split(/[|–—]/)[0].trim().slice(0,100)||new URL(url).hostname;
    const positions=[{y:0,label:name+' · main screen'}];
    for(const section of content.sections){if(positions.length===3)break;if(positions.every(p=>Math.abs(p.y-section.y)>550))positions.push(section);}
    if(positions.length<3&&content.height>1400)for(const fraction of [.45,.85]){const y=Math.min(content.height-900,Math.round(content.height*fraction));if(positions.length<3&&positions.every(p=>Math.abs(p.y-y)>500))positions.push({y,label:name+' · page section '+positions.length});}
    const images=[];
    for(const section of positions){
      await page.evaluate(y=>scrollTo(0,y),section.y);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.filter(img=>{const r=img.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).map(img=>img.decode().catch(()=>{})))).catch(()=>{});
      const capture=await saveCapture(await page.screenshot({type:'png',animations:'disabled',timeout:6000}));images.push({...capture,label:section.label});
    }
    const css=[...styles,{css:content.inlineCSS,url:page.url()}].map(s=>parseCSS(s.css,s.url));
    const colors=content.colors.map(c=>({...c,value:hexColor(c.value)})).filter(c=>c.value).filter((c,i,a)=>a.findIndex(v=>v.value===c.value)===i).slice(0,24);
    const fonts=css.flatMap(c=>c.fonts).filter(f=>content.families.includes(f.family)).sort((a,b)=>Number(/600/.test(b.weight))-Number(/600/.test(a.weight))).filter((f,i,a)=>a.findIndex(v=>v.family===f.family)===i).slice(0,8);
    return {url,name,title:content.title,description:source?.description??'',text:content.text,headings:content.headings,images,colors:colors.length?colors:source?.colors??[],fonts:fonts.length?fonts:source?.fonts??[],families:content.families,method:'rendered-page',capturedAt:new Date().toISOString(),warnings:[]};
  }finally{clearTimeout(deadline);signal?.removeEventListener('abort',abort);await browser.close();}
}
