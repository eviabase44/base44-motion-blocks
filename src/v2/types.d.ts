export type MotionShotId='hook'|'reveal'|'collage'|'focus'|'focus2'|'focus3'|'capabilities'|'ending';
export type CutType='cut'|'dissolve'|'slide-left'|'slide-right'|'wipe';
export interface ElementAdjustment {dx?:number;dy?:number;sx?:number;sy?:number;px?:number;py?:number;hidden?:boolean}
export interface ShotMotion {softness?:number;tempo?:number;movement?:number;joinFrames?:number;wordFrames?:number;scroll?:number;hover?:number;symbolFrames?:number;cutType?:CutType;cutFrames?:number}
export interface MotionSettings {version:1;style?:'original'|'refined';cadence?:12|24|60;shots:Partial<Record<MotionShotId,ShotMotion>>;elements?:Partial<Record<MotionShotId,Record<string,ElementAdjustment>>>}
export interface Region {x:number;y:number;width:number;height:number}
export interface ObservedMedia {src:string;width:number;height:number;region?:Region;hover?:Region}
export interface FeatureObservation {
  id:string;family:string;name:string;title:string;available?:boolean;
  media:ObservedMedia;page?:ObservedMedia;
  signals:{credits:number|null;visualRichness:number|null;viewport:number|null};
}
export interface ShowcaseSource {
  version:2;signalMode:'simulated'|'provided';
  app:{name:string;kind?:'app'|'agent'|'website'|'tool'};
  description:string;
  benefit?:string;images?:ObservedMedia[];motion?:MotionSettings;
  copy?:{hook?:[string,string,string,string,string,string];reveal?:[string,string,string,string,string];focus?:[string,string,string,string];category?:string;detail?:string};
  theme:{primary:string;accent:string;surface:string;ink:string;onPrimary:string;blocks?:string[]};
  typography:{family:string;src?:string|null;headlineWeight:number;bodyWeight:number;wordmarkWeight:number;letterSpacingEm?:number};
  homepage:ObservedMedia & {windowHeight?:number;title?:string};
  features:FeatureObservation[];
  audio?:{src:string;volume?:number};notes?:string;
}
