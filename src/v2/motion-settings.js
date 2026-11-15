// Serializable controls. Join poses are intentionally outside this contract.
export const MOTION_SHOTS=['hook','reveal','collage','focus','focus2','focus3','capabilities','ending'];
export const MOTION_DEFAULTS=Object.freeze({tempo:1,movement:1,joinFrames:6,wordFrames:2,scroll:1,hover:4,symbolFrames:5});
export const MOTION_FIELDS={
  tempo:{label:'Animation speed',min:.5,max:2,step:.05,format:v=>v.toFixed(2)+'×'},
  movement:{label:'Movement amount',min:0,max:1.5,step:.05,format:v=>Math.round(v*100)+'%'},
  joinFrames:{label:'Move into next shot',min:4,max:10,step:1,format:v=>(v/12).toFixed(2)+'s'},
  wordFrames:{label:'Word interval',min:0,max:4,step:1,format:v=>(v/12).toFixed(2)+'s'},
  scroll:{label:'Page scroll distance',min:0,max:1,step:.05,format:v=>Math.round(v*100)+'%'},
  hover:{label:'Card hover lift',min:0,max:12,step:1,format:v=>v+'px'},
  symbolFrames:{label:'Symbol row hold',min:2,max:16,step:1,format:v=>(v/12).toFixed(2)+'s'}
};
export const controlsFor=id=>({hook:['tempo','wordFrames','joinFrames'],reveal:['tempo','scroll','hover','joinFrames'],collage:['tempo','movement','joinFrames'],focus:['tempo','wordFrames','hover'],focus2:['tempo','wordFrames','hover'],focus3:['tempo','wordFrames','hover','joinFrames'],capabilities:['tempo','movement','joinFrames'],ending:['symbolFrames']})[id]??[];
export function validateMotion(input){
  if(input===undefined)return {version:1,shots:{}};
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==1||!input.shots||typeof input.shots!=='object'||Array.isArray(input.shots))throw Error('Invalid animation settings. Expected version 1 and a shots object.');
  const shots={};
  for(const [id,settings]of Object.entries(input.shots)){
    if(!MOTION_SHOTS.includes(id)||!settings||typeof settings!=='object'||Array.isArray(settings))throw Error('Unknown animation shot: '+id);
    shots[id]={};
    for(const [key,value]of Object.entries(settings)){
      const field=Object.hasOwn(MOTION_FIELDS,key)?MOTION_FIELDS[key]:null;
      if(!field||!controlsFor(id).includes(key)||!Number.isFinite(value)||value<field.min||value>field.max||(field.step===1&&!Number.isInteger(value)))throw Error(`Invalid ${id} animation setting: ${key}`);
      shots[id][key]=value;
    }
  }
  return {version:1,shots};
}
export function settingsFor(source,id){return {...MOTION_DEFAULTS,...source.motion?.shots?.[id]};}
// Re-time the interior only. Both endpoints remain exact for every speed.
export function motionFrame(frame,last,tempo=1){return last*(1-Math.pow(1-Math.max(0,Math.min(1,frame/last)),tempo));}
export function makeMotionPreset(source){return {format:'base44-shot-motion',version:1,app:source.app.name,motion:validateMotion(source.motion)};}
export function readMotionPreset(input){
  if(!input||input.format!=='base44-shot-motion'||input.version!==1)throw Error('Choose a Base44 animation preset JSON file.');
  return validateMotion(input.motion);
}
export const motionStorageKey=source=>'base44:shot-motion:1:'+encodeURIComponent(source.app.name.toLowerCase().trim());
export function saveMotion(storage,source){const preset=makeMotionPreset(source);storage.setItem(motionStorageKey(source),JSON.stringify(preset));return preset;}
export function loadMotion(storage,source){const value=storage.getItem(motionStorageKey(source));return value===null?null:readMotionPreset(JSON.parse(value));}
export const MATCH_CUTS=[
  {from:'hook',to:'reveal',anchor:'homepage',match:'Same homepage viewport and four corners'},
  {from:'reveal',to:'collage',anchor:'bundle-card',match:'Homepage zooms into the centered feature card'},
  {from:'collage',to:'focus',anchor:'feature-page',match:'The centered card opens into its full feature page'},
  {from:'focus',to:'focus2',anchor:'feature-window',match:'App window keeps the same bounds; its content changes'},
  {from:'focus2',to:'focus3',anchor:'feature-window',match:'App window keeps the same bounds; its content changes'},
  {from:'focus3',to:'capabilities',anchor:'capability-tile',match:'The third feature becomes the first grid tile'},
  {from:'capabilities',to:'ending',anchor:'brand-lockup',match:'The arrow and Base44 logo carry into the ending'}
];
