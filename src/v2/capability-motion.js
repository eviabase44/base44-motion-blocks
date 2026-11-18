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
export function capabilityOffset(frame,column,movement=1){
  const half=frame>=18?1:0,local=Math.max(0,Math.min(17,frame-half*18));
  const track=REFERENCE_TRACKS['collage-file-strip'].translation;
  const sample=Math.min(track.length-1,local*2),key=Math.floor(sample),next=Math.min(track.length-1,key+1);
  const value=track[key][0]+(track[next][0]-track[key][0])*(sample-key);
  const pull=1-value/track[0][0];
  return (column%2?1:-1)*(half+pull-1)*32*movement;
}

// Fixed-width stacks preserve each source's aspect ratio. Tiles meet edge to
// edge within their own column; the two columns share the center seam but
// travel in opposite directions. Keep source indices stable for saved edits.
export function capabilityLayout(tiles,frame,baseX,movement=1){
  const width=195,bottom=[17+capabilityOffset(frame,0,movement),17+capabilityOffset(frame,1,movement)];
  return tiles.map((media,i)=>{
    if(!media)return null;
    const column=i%2,r=sourceRegion(media),box={x:baseX+column*width,y:bottom[column],width,height:width*r.height/r.width};
    bottom[column]+=box.height;return box;
  });
}

export function connectorBoxes(box,size=10){
  // The lower pair overlaps the next tile's upper pair within each column.
  return [[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]]
    .map(([x,y])=>({x:x-size/2,y:y-size/2,width:size,height:size}));
}
