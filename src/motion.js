export function authoredOffset(frame,slot,vector) {
  const age=frame*2-slot*4;
  if(age<0||frame===0)return null;
  return vector.map(v=>(age<4?v:age<8?Math.sign(v)*15:0)/2);
}
export function endingTitleOffset(frame,line) {
  const age=frame-(2+line*3);
  if(age<0)return null;
  return age===0?24:age===1?8:0;
}
export function revealImageY(frame) {
  const t=frame/12,a=.10233561197917,b=.30110677083333;
  if(t<=a)return 17;if(t<b)return 17-12*(t-a)/(b-a);if(t<.5)return 5-5*(t-b)/(.5-b);return 0;
}
// Two vertical scrolls within the existing 46-frame focus shot, with a hold on each image.
export function featureScroll(frame,count=3) {
  const ease=t=>t*t*(3-2*t),progress=(start)=>ease(Math.max(0,Math.min(1,(frame-start)/4)));
  return Math.min(Math.max(0,count-1),progress(21)+progress(33));
}
