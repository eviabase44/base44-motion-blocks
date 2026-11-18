import {REFERENCE_TRACKS} from '../data/reference-tracks.js';

export function capabilityCopy(plan,second=false){
  const p=plan.source;
  if(second)return p.benefitFollowup??plan.selected[1].title;
  return p.benefit??`Now you can ${plan.selected[0].title.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())}.`;
}

// Two short pulls use the existing file-strip samples, at the study's 12 fps.
// The second composition continues from the first one's vertical endpoint;
// only the left/right arrangement and headline cut at frame 18.
export function capabilityOffset(frame,column,movement=1){
  const half=frame>=18?1:0,local=Math.max(0,Math.min(17,frame-half*18));
  const track=REFERENCE_TRACKS['collage-file-strip'].translation;
  const sample=Math.min(track.length-1,local*2),key=Math.floor(sample),next=Math.min(track.length-1,key+1);
  const value=track[key][0]+(track[next][0]-track[key][0])*(sample-key);
  const pull=1-value/track[0][0];
  return (column%2?1:-1)*(half+pull-1)*32*movement;
}

export function connectorBoxes(box,size=10){
  return [[box.x-size,box.y-size],[box.x+box.width,box.y-size],[box.x-size,box.y+box.height],[box.x+box.width,box.y+box.height]]
    .map(([x,y])=>({x,y,width:size,height:size}));
}
