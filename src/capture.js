// Run inside the host app, after rendering, on a deliberately selected public/product root.
// Send only app content the current user is authorized to use in the video.
export function captureAppSnapshot(root,{name=document.title,description='',url=location.href,fontAssets=[]}={}) {
  if(!(root instanceof Element))throw new Error('Pass the app content element to capture.');
  const clean=root.cloneNode(true);clean.querySelectorAll('script,style,nav,footer,input,textarea,[data-motion-private],[aria-hidden=true]').forEach(node=>node.remove());
  const publicAsset=value=>{try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}};
  const colors=[];
  for(const element of [root,...root.querySelectorAll('h1,h2,button,[data-motion-color]')].slice(0,20)){
    const css=getComputedStyle(element);for(const property of ['backgroundColor','color']){const value=css[property];if(value==='rgba(0, 0, 0, 0)'||colors.some(c=>c.value===value))continue;colors.push({value,role:property==='backgroundColor'?(element.matches('button')?'primary':'surface'):'text'});}
  }
  const images=[...root.querySelectorAll('img')].filter(image=>!image.closest('[data-motion-private]')&&(image.naturalWidth>=200||image.width>=200)).map(image=>({src:publicAsset(image.currentSrc||image.src),label:image.alt||'App image'})).filter(image=>image.src).slice(0,18);
  const fonts=fontAssets.slice();
  const family=getComputedStyle(root).fontFamily.split(',')[0].replace(/['"]/g,'').trim();
  if(!fonts.length)for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules;}catch{continue;}for(const rule of rules){if(rule.type!==CSSRule.FONT_FACE_RULE)continue;const f=rule.style.getPropertyValue('font-family').replace(/['"]/g,'').trim();if(f!==family)continue;const path=/url\(["']?([^)'"\s]+)/.exec(rule.style.getPropertyValue('src'))?.[1];if(path){const src=publicAsset(new URL(path,sheet.href??location.href).href);if(src)fonts.push({family:f,src,weight:rule.style.getPropertyValue('font-weight')||600});}}}
  return {url,name,description,text:clean.textContent.replace(/\s+/g,' ').trim().slice(0,14000),headings:[...clean.querySelectorAll('h1,h2,h3')].map(node=>node.textContent.trim()).slice(0,24),colors:colors.slice(0,24),fonts:fonts.slice(0,8),images};
}
