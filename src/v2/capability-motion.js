import {REFERENCE_TRACKS} from '../data/reference-tracks.js';
import {sourceRegion} from './model.js';

export function capabilityCopy(plan,second=false){
  const p=plan.source;
  if(second)return p.benefitFollowup??plan.selected[1].title;
  return p.benefit??`Now you can ${plan.selected[0].title.replace(/[.!?]+$/,'').replace(/^./,c=>c.toLowerCase())}.`;
}

// Two short pulls use the existing file-strip samples, at the study's 12 fps.
// The second composition continues from the first one's vertical endpoint;
// only the left/right arrangement and headline cut at frame 18.
export function capabilityOffset(frame,movement=1){
  const half=frame>=18?1:0,local=Math.max(0,Math.min(17,frame-half*18));
  const track=REFERENCE_TRACKS['collage-file-strip'].translation;
  const sample=Math.min(track.length-1,local*2),key=Math.floor(sample),next=Math.min(track.length-1,key+1);
  const value=track[key][0]+(track[next][0]-track[key][0])*(sample-key);
  const pull=1-value/track[0][0];
  return -(half+pull-1)*32*movement;
}

// Scale each pair to one shared row height while preserving both image ratios.
// Rows fill the same width, so all interior corners have a coincident neighbour.
// One shared motion offset keeps those joints locked throughout the shot.
export function capabilityLayout(tiles,frame,baseX,movement=1){
  const width=390,boxes=tiles.map(()=>null),items=tiles.flatMap((media,i)=>media?[{i,region:sourceRegion(media)}]:[]);
  let y=17+capabilityOffset(frame,movement);
  for(let row=0;row<items.length;row+=2){
    const pair=items.slice(row,row+2),height=width/pair.reduce((sum,{region:r})=>sum+r.width/r.height,0);
    let x=baseX;
    for(const {i,region:r} of pair){
      const w=height*r.width/r.height;
      boxes[i]={x,y,width:w,height};x+=w;
    }
    y+=height;
  }
  return boxes;
}

export function connectorBoxes(box,size=10){
  // Center each joint on the seam; neighbouring corners overlap exactly.
  return [[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]]
    .map(([x,y])=>({x:x-size/2,y:y-size/2,width:size,height:size}));
}
