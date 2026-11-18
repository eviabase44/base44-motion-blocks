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

// Fixed-width stacks preserve each source's aspect ratio. Ten-unit gutters
// separate the images horizontally and vertically, matching the corner-square
// size. Keep source indices stable for saved edits and opposing column motion.
export function capabilityLayout(tiles,frame,baseX,movement=1){
  const width=190,gap=10,heights=tiles.map(media=>{
    if(!media)return null;
    const r=sourceRegion(media);return width*r.height/r.width;
  });
  const totals=[0,0],counts=[0,0];
  heights.forEach((height,i)=>{if(height!==null){totals[i%2]+=height;counts[i%2]++;}});
  const bottom=totals.map((height,column)=>{
    height+=Math.max(0,counts[column]-1)*gap;
    // Tall original artwork needs enough travel to bring both ends of its
    // column into view. Keep the reference easing and opposite directions.
    const travel=Math.max(64,height-520);
    return (540-height)/2+capabilityOffset(frame,column,movement)*travel/64;
  });
  return tiles.map((media,i)=>{
    if(!media)return null;
    const column=i%2,box={x:baseX+column*(width+gap),y:bottom[column],width,height:heights[i]};
    bottom[column]+=box.height+gap;return box;
  });
}

export function connectorBoxes(box,size=10){
  // Squares sit outside the images, in the gutters. A lower pair coincides
  // with the next tile's upper pair, leaving one joint instead of two squares.
  return [[box.x-size,box.y-size],[box.x+box.width,box.y-size],[box.x-size,box.y+box.height],[box.x+box.width,box.y+box.height]]
    .map(([x,y])=>({x,y,width:size,height:size}));
}
