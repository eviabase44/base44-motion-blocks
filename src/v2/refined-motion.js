// Deterministic curves in authoring-frame units (12 units = one second).
// Smooth playback evaluates these curves between the original score frames.
export const clamp=t=>Math.max(0,Math.min(1,t));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const phase=(f,start,duration)=>clamp((f-start)/duration);
export const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
export function cubicBezier(x1,y1,x2,y2){
  const sample=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
  return value=>{const x=clamp(value);if(x===0||x===1)return x;let lo=0,hi=1,t=x;for(let i=0;i<16;i++){const v=sample(t,x1,x2);if(v<x)lo=t;else hi=t;t=(lo+hi)/2;}return sample(t,y1,y2);};
}
const crisp=cubicBezier(.22,1,.36,1),soft=cubicBezier(.32,0,.2,1);
export const arrive=(f,start,duration,softness=.5)=>{const t=phase(f,start,duration);return lerp(crisp(t),soft(t),softness);};
export const pulse=(f,start,duration)=>Math.sin(Math.PI*phase(f,start,duration))**2;
export function curvePoint(a,c,b,t){const u=smoother(t);return {x:(1-u)**2*a.x+2*(1-u)*u*c.x+u*u*b.x,y:(1-u)**2*a.y+2*(1-u)*u*c.y+u*u*b.y};}
export function refinedPreset(elements={}){return {version:1,style:'refined',cadence:60,shots:{hook:{tempo:1,wordFrames:1,joinFrames:8,softness:.32,movement:1},reveal:{tempo:1,scroll:1,hover:5,softness:.65},collage:{tempo:1,movement:1,softness:.35},focus:{tempo:1,wordFrames:1,hover:4,softness:.5,movement:1},focus2:{tempo:1,wordFrames:1,hover:4,softness:.5,movement:1},focus3:{tempo:1,wordFrames:1,hover:3,softness:.5,movement:1},capabilities:{tempo:1,movement:1,softness:.5},ending:{symbolFrames:5,softness:.5}},elements:structuredClone(elements)};}
