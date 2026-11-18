// Copycat native reconstruction: B44-04 Own Words, native F1280–1305, 24 fps.
// Geometry is measured in the 960 × 540 decoded source. No interpolated poses.
export const ENDCARD_SOURCE={id:'B44-04-own-words',fps:24,first:1280,last:1305};
const glyph=(name,x,y,width,height)=>({name,x,y,width,height,kind:'symbol'});
const letter=(name,x,width)=>({name,x,y:254,width,height:31,kind:'letter'});
const wide=[glyph('sentinel',261,248,40,40),glyph('knot',323,248,45,40),glyph('sprout',390,248,40,40),glyph('bloom',451,245,47,47),glyph('arrow',519,248,39,40),glyph('click',579,243,48,48),glyph('frame',648,249,39,40)];
const tight=[glyph('sentinel',319,248,40,40),glyph('knot',380,248,46,40),glyph('sprout',436,248,39,40),glyph('bloom',485,245,47,47),glyph('arrow',544,248,39,40),glyph('click',596,243,48,48)];
const resolved=[{name:'mark',x:392,y:253,width:36,height:36,kind:'mark'},{name:'wordmark',x:437,y:254,width:131,height:31,kind:'wordmark'}];
export function endcardPose(frame,symbolFrames=5){
  const start=Math.max(0,Math.min(10,15-symbolFrames));
  if(frame<start)return {phase:'credit',sourceFrame:null,items:[]};
  const sourceFrame=Math.min(1305,1280+Math.floor((frame-start)*10/symbolFrames));
  let items;
  if(sourceFrame<1282)items=wide;
  else if(sourceFrame<1283)items=tight;
  else if(sourceFrame<1285)items=[tight[0],letter('B',387,22),...tight.slice(2)];
  else if(sourceFrame<1287)items=[glyph('sentinel',349,248,40,40),letter('B',401,22),letter('a',428,20),glyph('arrow',460,248,40,40),letter('e',512,21),letter('4',540,22),letter('4',571,22)];
  else if(sourceFrame<1289)items=[sourceFrame===1287?glyph('sentinel',385,248,40,40):resolved[0],{name:'wordmark',x:437,y:254,width:131,height:31,kind:'wordmark',lastFourGap:14}];
  else items=resolved;
  return {phase:sourceFrame>=1289?'logo':'decode',sourceFrame,items};
}
