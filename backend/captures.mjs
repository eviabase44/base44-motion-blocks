import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {ImportError} from './public-fetch.mjs';

const directory=fileURLToPath(new URL('../.cache/captures/',import.meta.url));
const pattern=/^\/api\/captures\/([a-f0-9]{64})\.(png|jpg)$/;
export const isCaptureURL=value=>typeof value==='string'&&pattern.test(value);
export function capturePath(src,{root=directory}={}){
  const match=pattern.exec(src);if(!match)throw new ImportError('Invalid screen capture.',400,'INVALID_CAPTURE');
  return join(root,match[1]+'.'+match[2]);
}
export function requireCapture(src,options){
  if(!existsSync(capturePath(src,options)))throw new ImportError('This local screen capture is missing. Reconnect the app with its screens.',422,'CAPTURE_MISSING');
  return src;
}
export async function saveCapture(bytes,{root=directory}={}){
  const data=Buffer.from(bytes);
  let width=0,height=0,extension;
  if(data.length>=33&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&data.toString('ascii',12,16)==='IHDR'){width=data.readUInt32BE(16);height=data.readUInt32BE(20);extension='png';}
  else if(data[0]===255&&data[1]===216){
    for(let pos=2;pos+8<data.length;){if(data[pos]!==255)break;const marker=data[pos+1],length=data.readUInt16BE(pos+2);if(length<2||pos+length+2>data.length)break;if([192,193,194].includes(marker)){height=data.readUInt16BE(pos+5);width=data.readUInt16BE(pos+7);extension='jpg';break;}pos+=2+length;}
  }
  if(data.length>8_000_000||!extension)throw new ImportError('Provide a PNG or JPEG screen capture under 8 MB.',400,'INVALID_CAPTURE');
  if(width<100||height<80||width>10000||height>10000||width*height>30_000_000)throw new ImportError('Screen capture dimensions are unsupported.',400,'INVALID_CAPTURE');
  const src='/api/captures/'+createHash('sha256').update(data).digest('hex')+'.'+extension;
  await mkdir(root,{recursive:true});await writeFile(capturePath(src,{root}),data,{mode:0o600});
  return {src,width,height,kind:'screen'};
}
export async function readCapture(src,options){try{return await readFile(capturePath(src,options));}catch(error){if(error.code==='ENOENT')throw new ImportError('This local screen capture is missing. Reconnect the app.',404,'CAPTURE_MISSING');throw error;}}
