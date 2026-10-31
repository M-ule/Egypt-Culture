// Add name and glyph masks, never complete card values or screenshot fingerprints.
// Run from the repository root after placing the 2026-11-01 local fixtures.
const {createCanvas,loadImage}=require('@napi-rs/canvas'),fs=require('fs'),vm=require('vm');
(async()=>{const env={window:{}};vm.createContext(env);vm.runInContext(fs.readFileSync('photo-patterns.js','utf8'),env);const p=env.window.EgyptPhotoPatterns;
const masks=(c,box,kind)=>{const [x,y,w,h]=box,d=c.getContext('2d').getImageData(x,y,w,h),rows=[];for(let yy=0;yy<h;yy++){let row='';for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4,r=d.data[i],g=d.data[i+1],b=d.data[i+2];row+=(kind==='light'?Math.min(r,g,b)>180:kind==='top'?Math.min(r,g,b)>95:Math.max(r,g,b)<175)?'1':'0';}rows.push(row);}return rows;};
const load=async kind=>{const im=await loadImage('tests/fixtures/egypt-level5-'+kind+'.jpeg'),c=createCanvas(1536,709);c.getContext('2d').drawImage(im,0,0,1536,709);return c;};
const a=await load('buildings'),b=await load('stocks');
// Name masks already cover this layout. Extend only individual numeral glyphs.
const names=[];
const glyphs=[['5','light',[128,131,7,15],'buildings'],['5','light',[260,131,7,15],'buildings'],['5','light',[128,395,7,15],'buildings'],['5','light',[260,527,7,15],'buildings'],['5','badge',[205,70,9,17],'buildings'],['5','badge',[205,202,9,17],'buildings'],['5','badge',[337,70,9,17],'buildings'],['6','badge',[205,334,9,17],'buildings'],['9','dark',[732,187,10,20],'stocks'],['9','dark',[389,270,10,20],'stocks'],['2','top',[666,18,7,19],'stocks'],['6','top',[676,18,7,19],'stocks'],['5','top',[686,18,6,19],'stocks'],['0','top',[700,18,7,19],'stocks']];
for(const scale of [1,.75,1.25]){const variants={};for(const [kind,src]of [['buildings',a],['stocks',b]]){const small=createCanvas(Math.round(1536*scale),Math.round(709*scale));small.getContext('2d').drawImage(src,0,0,small.width,small.height);const c=createCanvas(Math.round(small.width*709/small.height),709);c.getContext('2d').drawImage(small,0,0,c.width,709);variants[kind]=c;}
 for(const [id,box]of names)p.names.push({id,kind:'light',rows:masks(variants.buildings,box,'light')});
 for(const [text,kind,box,source]of glyphs)p.glyphs.push({text,kind,rows:masks(variants[source],box,kind)});
}

p.names=p.names.filter((n,i,a)=>a.findIndex(v=>JSON.stringify(v)===JSON.stringify(n))===i);p.glyphs=p.glyphs.filter((n,i,a)=>a.findIndex(v=>JSON.stringify(v)===JSON.stringify(n))===i);
fs.writeFileSync('photo-patterns.js','/* Visual name and individual glyph samples; numbers are read independently. */\nwindow.EgyptPhotoPatterns='+JSON.stringify(p)+';\n');})();
