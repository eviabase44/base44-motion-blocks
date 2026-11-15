import type {ShowcaseSource, Region, MotionSettings} from './v2/types.js';
export type BaseShotId = 'hook' | 'reveal' | 'collage' | 'focus' | 'ending';
export type ShotId = BaseShotId | 'focus2' | 'focus3' | 'capabilities';
type FocusVariant = 'original'|'diagonal-window'|'six-week'|'six-day';
export interface VariantByShot {hook:'original'|'agency-line'|'dark-statement'|'karaoke';reveal:'original'|'screen-stage'|'echo-right'|'echo-left';collage:'original'|'fragment-field'|'file-strip'|'echo-collage';focus:FocusVariant;focus2:FocusVariant;focus3:FocusVariant;capabilities:'original';ending:'original'}
export type VariantId = VariantByShot[ShotId];
export type VariantSelection = Partial<VariantByShot>;
export type MediaSlot = {label:string; color?:string; src:string|null; width?:number; height?:number; region?:Region; hover?:Region; fit?:'contain'};
export interface AppPayload {
  version:1;
  app:{name:string; kind:'app'|'agent'|'website'|'tool'};
  theme:{primary:string; surface:string; onPrimary:string; accent:string; ink:string; blocks:string[]};
  typography:{family:string; headlineWeight:number; bodyWeight:number; wordmarkWeight:number; letterSpacingEm?:number; src:string|null};
  copy:{hook:[string,string,string,string,string,string]; reveal:[string,string,string,string,string]; focus:[string,string,string,string]; category:string; detail:string};
  media:{hero:MediaSlot;ending?:MediaSlot}&({features:[MediaSlot,MediaSlot,MediaSlot];feature?:MediaSlot}|{feature:MediaSlot;features?:never});
  cards:{title:string;subtitle:string;media:MediaSlot}[];
  showcase?:ShowcaseSource;
}
export interface FrameState {frame:number;seconds:number;totalFrames:number;duration:number;playing:boolean;loop:boolean;shot:ShotId;localFrame:number;variant:VariantId}
export interface MotionPlayer {
  play():void; pause():void; seekFrame(n:number):void; seek(seconds:number):void;
  setLoop(value:boolean):void; setSequence(ids:ShotId[]):void; setShot(id:ShotId):void;
  setVariant<S extends ShotId>(id:S,variant:VariantByShot[S]):void; getVariants():VariantSelection;
  applyTemplate(template:{payload:AppPayload;variants:VariantSelection;wireframe?:boolean}):Promise<boolean>;
  setWireframe(value:boolean):void; getWireframe():boolean; setSound(value:boolean):void; setMotion(value:MotionSettings):void;
  update(payload:AppPayload):Promise<boolean>; getPayload():AppPayload; getState():FrameState; destroy():void;
}
export function createMotionPlayer(container:HTMLElement,options:{payload:AppPayload;shot?:ShotId;sequence?:ShotId[];variants?:VariantSelection;wireframe?:boolean;onFrame?:(state:FrameState)=>void;onError?:(error:Error)=>void}):Promise<MotionPlayer>;
export function renderShot(id:ShotId,frame:number,payload:AppPayload,options?:{wireframe?:boolean;variant?:VariantId}):SVGElement;
export function renderSequenceFrame(order:ShotId[],frame:number,payload:AppPayload,options?:{wireframe?:boolean;variants?:VariantSelection}):SVGElement;
export function loadAppFont(payload:AppPayload):Promise<void>;
export interface AppSnapshot {url:string;name:string;description?:string;text:string;headings?:string[];colors?:{value:string;role:string}[];fonts?:{family:string;src:string;weight?:number|string}[];images?:{src:string;label:string;kind?:'screen'}[]}
export interface GeneratedTemplate {payload:AppPayload;variants:VariantSelection;reasons:Record<Exclude<BaseShotId,'ending'>,string>;source:{url:string;name:string;method:string;imageCount:number;screenCount?:number;font:string|null;capturedAt?:string};sourceAssets:Record<string,{url:string;kind:'image'|'font'}>;warnings:string[];provider:string;duration:15|19;generatedAt:string}
export const FPS:12;
export const TOTAL_FRAMES:180;
export const SHOTS:ReadonlyArray<{id:ShotId;name:string;frames:number;source:number;description:string;slots:string[]}>;

export const SHOT_VARIANTS:Record<BaseShotId,ReadonlyArray<{id:VariantId;name:string;description:string}>>;
