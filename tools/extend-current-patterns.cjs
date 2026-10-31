// Add name and glyph masks, never complete card values or screenshot fingerprints.
// Run from the repository root after placing the 2026-10-31 local fixtures.
const {createCanvas,loadImage}=require('@napi-rs/canvas'),fs=require('fs'),vm=require('vm');
(async()=>{const env={window:{}};vm.createContext(env);vm.runInContext(fs.readFileSync('photo-patterns.js','utf8'),env);const p=env.window.EgyptPhotoPatterns;
const masks=(c,box,kind)=>{const [x,y,w,h]=box,d=c.getContext('2d').getImageData(x,y,w,h),rows=[];for(let yy=0;yy<h;yy++){let row='';for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4,r=d.data[i],g=d.data[i+1],b=d.data[i+2];row+=(kind==='light'?Math.min(r,g,b)>180:kind==='top'?Math.min(r,g,b)>95:Math.max(r,g,b)<175)?'1':'0';}rows.push(row);}return rows;};
const load=async kind=>{const im=await loadImage('tests/fixtures/egypt-current-'+kind+'.jpeg'),c=createCanvas(1536,709);c.getContext('2d').drawImage(im,0,0,1536,709);return c;};
const a=await load('buildings'),b=await load('stocks');
const names=[['papyrus',[94,102,125,19]],['goldmine',[226,102,34,19]],['pump',[94,233,54,19]],['channel',[226,233,34,19]],['hall',[94,367,34,19]],['press',[226,366,114,20]],['smith',[94,498,65,20]],['smallhome',[226,497,56,20]]];
const glyphs=[['2','light',[127,263,9,14],'buildings'],['2','light',[127,395,9,14],'buildings'],['4','light',[127,526,7,14],'buildings'],['2','badge',[205,466,7,17],'buildings'],['3','badge',[332,466,8,17],'buildings'],['0','badge',[342,467,7,14],'buildings'],['4','badge',[205,69,8,17],'buildings'],['8','badge',[337,203,8,14],'buildings'],['1','dark',[690,187,9,20],'stocks'],['7','dark',[701,187,11,20],'stocks'],['8','dark',[714,187,9,20],'stocks'],['K','top',[494,18,8,19],'stocks']];
for(const scale of [1,.75,1.25]){const variants={};for(const [kind,src]of [['buildings',a],['stocks',b]]){const small=createCanvas(Math.round(1536*scale),Math.round(709*scale));small.getContext('2d').drawImage(src,0,0,small.width,small.height);const c=createCanvas(Math.round(small.width*709/small.height),709);c.getContext('2d').drawImage(small,0,0,c.width,709);variants[kind]=c;}
 for(const [id,box]of names)p.names.push({id,kind:'light',rows:masks(variants.buildings,box,'light')});
 for(const [text,kind,box,source]of glyphs)p.glyphs.push({text,kind,rows:masks(variants[source],box,kind)});
}

p.names=p.names.filter((n,i,a)=>a.findIndex(v=>JSON.stringify(v)===JSON.stringify(n))===i);p.glyphs=p.glyphs.filter((n,i,a)=>a.findIndex(v=>JSON.stringify(v)===JSON.stringify(n))===i);
fs.writeFileSync('photo-patterns.js','/* Visual name and individual glyph samples; numbers are read independently. */\nwindow.EgyptPhotoPatterns='+JSON.stringify(p)+';\n');})();
