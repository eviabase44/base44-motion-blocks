import {mediaSources} from './media.js';
// URL import UI. All model credentials and fetching stay on the server.
export function connectURLImporter({applyTemplate,getTemplate,onApplied}){
  const $=id=>document.getElementById(id),form=$('url-form'),input=$('app-url'),button=$('generate-video'),status=$('import-status');let controller=null,lastResult=null;
  const message=(text,error=false)=>{status.hidden=false;status.textContent=text;status.dataset.error=String(error);};
  const withCode=data=>Object.assign(new Error(data.error??'Generation failed. Try again.'),{code:data.code});
  let connectionCheck=0;
  async function checkConnection(){const ticket=++connectionCheck,url=input.value.trim();$('preview-connection-status').hidden=true;$('preview-help').hidden=true;if(!url)return;try{const response=await fetch('/api/preview-connections?'+new URLSearchParams({url}));const data=await response.json();if(ticket!==connectionCheck)return;if(data.connected){$('preview-connection-status').hidden=false;$('preview-connection-status').textContent=`Connected preview · ${data.name} · saved ${new Date(data.capturedAt).toLocaleString()}`;}}catch{}}
  input.addEventListener('change',checkConnection);input.addEventListener('blur',checkConnection);
  $('connect-preview').onclick=async()=>{const notice=$('preview-save-status');$('connect-preview').disabled=true;try{const snapshot=JSON.parse($('preview-snapshot').value),url=input.value.trim()||snapshot.url;
      const files=[...$('preview-screens').files];
      if(files.length>12)throw Error('Choose up to 12 app screen captures.');
      for(const file of files){const response=await fetch('/api/captures',{method:'POST',headers:{'Content-Type':file.type},body:file}),image=await response.json();if(!response.ok)throw withCode(image);(snapshot.images??=[]).push({...image,label:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')});}
      const response=await fetch('/api/preview-connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,snapshot})}),data=await response.json();if(!response.ok)throw withCode(data);input.value=data.url;notice.textContent=`${data.name} connected.`;$('preview-snapshot').value='';$('preview-screens').value='';$('preview-connection').open=false;status.hidden=true;await checkConnection();}catch(error){notice.textContent=error.message;}finally{$('connect-preview').disabled=false;}};
  fetch('/api/capabilities').then(r=>r.json()).then(data=>{$('ai-provider').textContent=data.ready?`${data.label} · Ready`:'AI connection needed';if(!data.ready)message('To enable generation, connect an AI provider on the server. Developer notes include setup.');}).catch(()=>{$('ai-provider').textContent='Start the local server to enable AI';});
  function showResult(result){
    lastResult=result;$('import-result').hidden=false;$('import-summary').textContent=`${result.payload.app.name} · ${result.payload.showcase?7:5} shots · ${result.payload.showcase?19:15} seconds · ${mediaSources(result.payload).length} screen images`;
    if(!mediaSources(result.payload).length)message('This saved import has no app screens. Generate it again after connecting screen captures.',true);
    const decisions=$('ai-decisions');decisions.replaceChildren();
    for(const [id,label] of [['hook','Opening'],['reveal','App reveal'],['collage','Card burst'],['focus','Feature focus']]){const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=label;li.append(strong,document.createTextNode(result.reasons[id]));decisions.append(li);}
    const warnings=$('import-warnings');warnings.replaceChildren();for(const text of result.warnings){const li=document.createElement('li');li.textContent=text;warnings.append(li);}
  }
  async function submit(event){
    event?.preventDefault();if(controller)return;
    const url=input.value.trim();if(!url){input.focus();return;}
    controller=new AbortController();button.disabled=true;input.disabled=true;$('cancel-import').hidden=false;$('url-import').setAttribute('aria-busy','true');message('Reading app content and brand…');
    try{
      for(let attempt=0;attempt<3;attempt++){
      const response=await fetch('/api/generate',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},body:JSON.stringify({url,compact:attempt})});
      if(!response.ok)throw withCode(await response.json());
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',result;
      while(true){const {done,value}=await reader.read();buffer+=decoder.decode(value??new Uint8Array(),{stream:!done});let end;while((end=buffer.indexOf('\n'))>=0){const raw=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!raw.trim())continue;const event=JSON.parse(raw);if(event.type==='progress')message(event.message);else if(event.type==='error')throw withCode(event);else if(event.type==='result')result=event.result;}if(done)break;}
      if(!result)throw new Error('The connection ended before the video was ready. Please retry.');
      message('Loading the app screens and fitting the copy…');
      try{await applyTemplate(result);}catch(error){if(attempt<2&&/shorten|fit|too long/i.test(error.message)){message('AI is shortening the copy to fit your app’s font…');continue;}throw error;}
      showResult(result);onApplied?.(result);message('Your video is ready. Playing the full sequence.');void checkConnection();break;
      }
    }catch(error){message(error.name==='AbortError'?'Generation canceled. Your previous video is unchanged.':error.message,error.name!=='AbortError');if(['PREVIEW_CONNECTION_REQUIRED','LOGIN_REQUIRED','NO_APP_SCREENS','SNAPSHOT_REQUIRED'].includes(error.code)){$('preview-help').hidden=false;const link=new URL(/^https?:/.test(url)?url:'https://'+url);link.search='';link.hash='';$('open-app-preview').href=link.href;}}
    finally{controller=null;button.disabled=false;input.disabled=false;$('cancel-import').hidden=true;$('url-import').removeAttribute('aria-busy');}
  }
  form.addEventListener('submit',submit);$('cancel-import').onclick=()=>controller?.abort();
  const zone=$('url-import');zone.addEventListener('dragover',event=>{if(event.dataTransfer.types.some(t=>['text/uri-list','text/plain'].includes(t))){event.preventDefault();zone.dataset.drag='true';}});
  zone.addEventListener('dragleave',()=>delete zone.dataset.drag);zone.addEventListener('drop',event=>{event.preventDefault();delete zone.dataset.drag;if(controller)return;const raw=event.dataTransfer.getData('text/uri-list')||event.dataTransfer.getData('text/plain'),url=raw.split(/\r?\n/).find(line=>line.trim()&&!line.startsWith('#'))?.trim();if(url){input.value=url;submit();}});
  $('download-template').onclick=()=>{if(!lastResult)return;const template={...lastResult,...getTemplate()};const original=src=>template.sourceAssets?.[src]?.url??src;template.payload.typography.src=original(template.payload.typography.src);template.payload.media.hero.src=original(template.payload.media.hero.src);template.payload.media.features?.forEach(m=>m.src=original(m.src));template.payload.cards.forEach(c=>c.media.src=original(c.media.src));const url=URL.createObjectURL(new Blob([JSON.stringify(template,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='app-video-template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return {showResult,checkConnection,cancel:()=>controller?.abort()};
}
