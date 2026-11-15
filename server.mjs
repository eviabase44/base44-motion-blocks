import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {handleAPI} from './backend/api.mjs';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const port=Number(process.env.PORT??8782);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.ts':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try{
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){res.writeHead(403);res.end('Invalid host');return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(await handleAPI(req,res,pathname))return;
    if(!['GET','HEAD'].includes(req.method)||pathname.split('/').some(part=>part.startsWith('.'))||pathname.startsWith('/backend/')||pathname.includes('node_modules')){res.writeHead(404);res.end('Not found');return;}
    let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep))throw new Error('Invalid path');
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const data=await readFile(file),headers={'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      const start=match?.[1]?Number(match[1]):Math.max(0,data.length-Number(match?.[2])),end=match?.[1]&&match?.[2]?Math.min(data.length-1,Number(match[2])):data.length-1;
      if(!match||(!match[1]&&!match[2])||start>=data.length||start>end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`});res.end(req.method==='HEAD'?undefined:data.subarray(start,end+1));
    }else{res.writeHead(200,{...headers,'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);}
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Motion blocks: http://127.0.0.1:${port}`));
