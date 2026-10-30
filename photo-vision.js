/* Visual name anchors and independent digit reading; no screenshot/value lookup. */
(()=>{'use strict';
const patterns=window.EgyptPhotoPatterns;
function bitmap(image,kind,threshold){const {data,width:w,height:h}=image, bits=new Uint8Array(w*h);for(let i=0;i<bits.length;i++){const p=i*4,r=data[p],g=data[p+1],b=data[p+2];bits[i]=(kind==='light'||kind==='top')?+(Math.min(r,g,b)>(threshold??(kind==='top'?95:180))):+(Math.max(r,g,b)<(threshold??175));}return {bits,w,h};}
function points(rows,v){const p=[];for(let y=0;y<rows.length;y++)for(let x=0;x<rows[0].length;x++)if(rows[y][x]===v)p.push([x,y]);return p;}
function score(map,rows,x,y){let both=0,total=0;for(let j=0;j<rows.length;j++)for(let i=0;i<rows[0].length;i++){const a=rows[j][i]==='1',b=map.bits[(y+j)*map.w+x+i];if(a&&b)both++;if(a||b)total++;}return both/Math.max(1,total);}
function locate(map,pattern){const rows=pattern.rows,w=rows[0].length,h=rows.length,pos=points(rows,'1'),neg=points(rows,'0'),sample=[];if(!pos.length)return [];for(let i=0;i<20;i++)sample.push(pos[Math.floor(i*pos.length/20)]);for(let i=0;i<12;i++)sample.push(neg[Math.floor(i*neg.length/12)]);
 const found=[],xEnd=pattern.kind==='light'?Math.min(map.w-w,Math.floor(map.w*.48)):map.w-w;
 for(let y=0;y<map.h-h;y+=2)for(let x=0;x<xEnd;x+=2){let misses=0;for(let i=0;i<sample.length;i++){const p=sample[i];if(map.bits[(y+p[1])*map.w+x+p[0]]!==(i<20?1:0)&&++misses>(pattern.kind==='light'?13:11))break;}if(misses>(pattern.kind==='light'?13:11))continue;
 let best=0,bx=x,by=y;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx<0||y+dy<0)continue;const s=score(map,rows,x+dx,y+dy);if(s>best){best=s;bx=x+dx;by=y+dy;}}if(best<.70)continue;if(found.some(f=>Math.abs(f.x-bx)<w*.6&&Math.abs(f.y-by)<h))continue;found.push({id:pattern.id,x:bx,y:by,w,h,score:best});}
 return found;
}
function trim(rows){while(rows.length&&!rows[0].includes('1'))rows.shift();while(rows.length&&!rows.at(-1).includes('1'))rows.pop();if(!rows.length)return [];let lo=rows[0].length,hi=0;for(const r of rows)for(let x=0;x<r.length;x++)if(r[x]==='1'){lo=Math.min(lo,x);hi=Math.max(hi,x);}return rows.map(r=>r.slice(lo,hi+1));}
function glyphScore(a,b){a=trim(a);b=trim(b);if(!a.length||!b.length)return 0;const w=12,h=22;let same=0,total=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const aa=a[Math.floor(y*a.length/h)][Math.floor(x*a[0].length/w)]==='1',bb=b[Math.floor(y*b.length/h)][Math.floor(x*b[0].length/w)]==='1';if(aa&&bb)same++;if(aa||bb)total++;}return same/Math.max(1,total);}
function sharedScore(rows,reference){rows=trim(rows);if(!rows.length)return 0;const w=20,h=32,scale=Math.min(18/rows[0].length,30/rows.length),rw=rows[0].length*scale,rh=rows.length*scale,left=(w-rw)/2,top=(h-rh)/2;let both=0,total=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.floor((x-left)/scale),sy=Math.floor((y-top)/scale),a=sx>=0&&sx<rows[0].length&&sy>=0&&sy<rows.length&&rows[sy][sx]==='1',b=reference[y][x]==='1';if(a&&b)both++;if(a||b)total++;}return both/Math.max(1,total);}
function consensus(readings){const votes=new Map();for(const r of readings)if(r?.value!==null&&r?.value!==undefined)votes.set(r.value,(votes.get(r.value)||0)+1);const ranked=[...votes].sort((a,b)=>b[1]-a[1]);return {value:ranked.length&&(ranked[0][1]>=2||ranked.length===1)?ranked[0][0]:null,candidates:ranked.map(r=>r[0]),needsReview:ranked.length!==1||ranked[0][1]<2};}
const masks=new WeakMap();function thresholdMap(image,kind,t){let cache=masks.get(image);if(!cache){cache=new Map();masks.set(image,cache);}const key=kind+'_'+t;if(!cache.has(key))cache.set(key,bitmap(image,kind,t));return cache.get(key);}
function readNumber(image,box,kind){return consensus((kind==='light'?[165,180,195]:kind==='top'?[85,95,110]:[155,175,195]).map(t=>digits(thresholdMap(image,kind,t),box,kind)));}
function digits(map,box,kind){const x0=Math.max(0,Math.floor(box.x)),y0=Math.max(0,Math.floor(box.y)),w=Math.min(Math.ceil(box.w),map.w-x0),h=Math.min(Math.ceil(box.h),map.h-y0),runs=[];let start=-1;
 for(let x=0;x<=w;x++){let n=0;if(x<w)for(let y=0;y<h;y++)n+=map.bits[(y0+y)*map.w+x0+x];if(n&&start<0)start=x;if(!n&&start>=0){runs.push([start,x]);start=-1;}}
 let text='',confidence=1;for(const [a,b]of runs){const rows=[];for(let y=0;y<h;y++){let row='';for(let x=a;x<b;x++)row+=map.bits[(y0+y)*map.w+x0+x];rows.push(row);}const tight=trim(rows);if(!tight.length||tight.length<8)continue;const native=new Map();for(const g of patterns.glyphs.filter(g=>g.kind===kind))native.set(g.text,Math.max(native.get(g.text)||0,glyphScore(tight,g.rows)));const ranked=[...native].map(([text,score])=>({text,score})).sort((a,b)=>b.score-a.score);
 let chosen=ranked[0],margin=(chosen?.score||0)-(ranked[1]?.score||0);
 if(!chosen||chosen.score<.85||margin<.08){const generic=Object.entries(window.EgyptSharedDigits||{}).map(([text,variants])=>({text,score:Math.max(...variants.map(rows=>sharedScore(tight,rows)))})).sort((a,b)=>b.score-a.score);if(generic[0]?.score>=.80&&generic[0].score-(generic[1]?.score||0)>=.08){chosen=generic[0];margin=generic[0].score-(generic[1]?.score||0);}}
 if(!chosen||chosen.score<.60||margin<.05)return null;text+=chosen.text;confidence=Math.min(confidence,chosen.score);}

 return text?{value:Number(text),confidence}:null;
}
function badge(image,anchor,dark){const {data,width:w,height:h}=image,x0=Math.max(0,anchor.x+75),y0=Math.max(0,anchor.y-65),rw=Math.min(57,w-x0),rh=Math.min(65,h-y0),mask=new Uint8Array(rw*rh),groups=[];
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const p=((y0+y)*w+x0+x)*4,r=data[p],g=data[p+1],b=data[p+2];mask[y*rw+x]=+(r>190&&g>105&&g<200&&b<95);}
 for(let i=0;i<mask.length;i++){if(!mask[i])continue;const queue=[i];mask[i]=0;let minX=rw,minY=rh,maxX=0,maxY=0;for(let k=0;k<queue.length;k++){const n=queue[k],x=n%rw,y=Math.floor(n/rw);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<rw&&yy>=0&&yy<rh&&mask[yy*rw+xx]){mask[yy*rw+xx]=0;queue.push(yy*rw+xx);}}}if(queue.length>180&&maxX-minX>15&&maxY-minY>18)groups.push({minX:x0+minX,maxX:x0+maxX,minY:y0+minY,maxY:y0+maxY,size:queue.length});}
 let initial=null;if(groups.length){const b=groups.sort((a,b)=>b.size-a.size)[0],left=b.minX+13;const box={x:left,y:b.minY+6,w:b.maxX-2-left,h:20};initial={...readNumber(image,box,'badge'),box};if(initial.value!==null&&!initial.needsReview)return initial;}
 // Viking's orange-ring recovery handles a badge connected to a roof.
 const orange=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return 0;const p=(Math.round(y)*w+Math.round(x))*4,r=data[p],g=data[p+1],b=data[p+2];return +(r>175&&g>98&&g<227&&b<140&&r>g+30&&g>b+20);};let ring=null;
 for(let cy=anchor.y-42;cy<=anchor.y-14;cy+=2)for(let cx=anchor.x+88;cx<=anchor.x+126;cx+=2){let inside=0,outside=0;for(let i=0;i<32;i++){const a=i*Math.PI/16;for(const r of [11,13])inside+=orange(cx+r*Math.cos(a),cy+r*Math.sin(a));outside+=orange(cx+19*Math.cos(a),cy+19*Math.sin(a));}const score=inside/64-.18*outside/32;if(inside>=46&&score>=.69&&(!ring||score>ring.score))ring={cx,cy,score};}
 if(ring){const recovered=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)recovered.push(readNumber(image,{x:ring.cx-2+dx,y:ring.cy-10+dy,w:15,h:20},'badge'));const result=consensus(recovered);const box={x:ring.cx-2,y:ring.cy-10,w:15,h:20};if(result.value!==null)return {...result,box};return {...result,box,needsReview:true};}
 return initial||{value:1,confidence:.8,needsReview:false,candidates:[1]};
}
function topStocks(image){const {data,width:w,height:h}=image,out=[],map=bitmap(image,'top');
 for(const icon of patterns.icons){let best=null;for(let y=0;y<Math.min(70,h-icon.h);y+=2)for(let x=0;x<w-icon.w;x+=2){let error=0,failed=false;for(const p of icon.points){const n=((y+p[1])*w+x+p[0])*4;error+=Math.abs(data[n]-p[2])+Math.abs(data[n+1]-p[3])+Math.abs(data[n+2]-p[4]);if(error>icon.points.length*3*18){failed=true;break;}}if(!failed&&(!best||error<best.error))best={x,y,error};}
 if(!best)continue;const n=readNumber(image,{x:best.x+icon.w+5,y:best.y+8,w:62,h:19},'top');out.push({target:icon.id,...n,box:{x:best.x+icon.w+5,y:best.y+8,w:62,h:19},numberKind:'top'});}return out;
}
function recognize(image,kind){const light=bitmap(image,'light'),dark=bitmap(image,'dark'),anchors=patterns.names.filter(p=>(kind==='buildings')===(p.kind==='light')).flatMap(p=>locate(p.kind==='light'?light:dark,p)),out=[];const unique=anchors.filter(a=>!anchors.some(b=>b!==a&&b.id===a.id&&Math.abs(b.x-a.x)<15&&Math.abs(b.y-a.y)<15&&(b.score>a.score||b.score===a.score&&anchors.indexOf(b)<anchors.indexOf(a))));
 for(const a of unique){if(kind==='stocks'){const box={x:a.x,y:a.y+23,w:Math.max(100,a.w),h:24},n=readNumber(image,box,'dark');out.push({target:a.id,...n,anchor:a,box,numberKind:'dark'});continue;}
 const lvBox={x:a.x+32,y:a.y+26,w:14,h:21},lv=readNumber(image,lvBox,'light'),count=badge(image,a,dark);out.push({building:a.id,lv:lv?.value??null,count:count?.value??null,lvReading:lv,countReading:count,anchor:a,lvBox});}
 if(kind==='stocks')out.push(...topStocks(image));else{const hints=(patterns.levelLabels||[]).flatMap(p=>locate(light,p)).filter(h=>h.y>80);out.needsOCR=hints.some(h=>!unique.some(a=>Math.abs(a.x-h.x)<15&&Math.abs(a.y+29-h.y)<10));}return out;
}
window.EgyptPhotoVision={recognize,consensus,readNumber};
})();
