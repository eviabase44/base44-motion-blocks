import {DAZZED_FONT_URL} from '../brand.js';
const palettes={
  wireframe:{primary:'#253fe6',surface:'#f2f1ed',onPrimary:'#ffffff',accent:'#fb784c',ink:'#172027',blocks:['#a9b8ee','#e4ad8f','#b9cbb6','#d2c2e2','#e4d58e','#a4c9ca']},
  forma:{primary:'#006c3c',surface:'#fffce9',onPrimary:'#f0f4a9',accent:'#ff5414',ink:'#162d24',blocks:['#a5b99b','#e3ad8e','#c6d098','#9db6a4','#e1ce9a','#b9cba6']},
  atlas:{primary:'#4b334d',surface:'#f6efe6',onPrimary:'#f5dace',accent:'#dd704f',ink:'#332734',blocks:['#ccafa5','#d9c291','#adbca6','#bdadc8','#d7b6a0','#aeb9c7']}
};
const specs={
  wireframe:{name:'YOUR APP',kind:'app',hook:['I built','an app','that','connects','people','to ideas.'],reveal:['Your','headline','And','another','benefit.'],focus:['Show','one','feature','here'],category:'APP CATEGORY',detail:'FEATURE NAME · APP CONTEXT',titles:['Primary card','Second card','Feature card','Key metric','Call to action','Wide image','App identity','Profile card','Detail card']},
  forma:{name:'FORMA',kind:'app',hook:['I built','an app','that','books','Pilates','classes.'],reveal:['Pilates','classes','And','private','sessions.'],focus:['Book','a','class','today'],category:'PILATES CLASSES',detail:'REFORMER FLOW · NORTH STUDIO',titles:['Reformer Flow','Slow & Strong','Mat Foundations','$28 / class','Book a class','The studio','FORMA','With Maya','Private sessions']},
  atlas:{name:'ATLAS',kind:'tool',hook:['I built','a tool','that','plans','better','weekends.'],reveal:['Local','places','And','curated','weekends.'],focus:['Find','your','place','today'],category:'WEEKEND PLANNER',detail:'NEARBY PLACES · SAVED FOR LATER',titles:['Coastal walk','Morning coffee','Hidden gardens','12 saved spots','Plan a weekend','Around town','ATLAS','Local guides','Your next trip']}
};
export function makeProfile(id='wireframe',assetRoot=new URL('../../assets/',import.meta.url)) {
  const s=specs[id];if(!s)throw new Error(`Unknown profile: ${id}`);
  return {version:1,app:{name:s.name,kind:s.kind},theme:structuredClone(palettes[id]),typography:{family:'Dazzed',headlineWeight:600,bodyWeight:600,wordmarkWeight:600,letterSpacingEm:-.03,src:DAZZED_FONT_URL},copy:{hook:s.hook.slice(),reveal:s.reveal.slice(),focus:s.focus.slice(),category:s.category,detail:s.detail},media:{hero:{label:'APP SCREEN',src:null},features:[0,1,2].map(i=>({label:id==='wireframe'?`FEATURE IMAGE ${String(i+1).padStart(2,'0')}`:s.titles[i],src:null}))},cards:s.titles.map((title,i)=>({title,subtitle:id==='wireframe'?`Replaceable content ${String(i+1).padStart(2,'0')}`:id==='forma'?'Move at your own pace':'Make time for somewhere new',media:{label:`IMAGE ${String(i+1).padStart(2,'0')}`,src:null}}))};
}
export const PROFILE_OPTIONS=[{id:'wireframe',name:'Wireframe'},{id:'forma',name:'Forma · Pilates'},{id:'atlas',name:'Atlas · demo app'}];
