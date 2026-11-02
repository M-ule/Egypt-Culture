const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fixture=path.join(__dirname,'fixtures/egypt-level6-stocks.jpeg');
test('November 2 stock photo preserves 3077 and 360 instead of silently changing zero to six',{skip:!fs.existsSync(fixture)},async()=>{
 const env={window:{}};vm.createContext(env);for(const file of ['photo-digit-patterns.js','photo-patterns.js','photo-vision.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),env);
 const im=await loadImage(fixture),c=createCanvas(1536,709);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
 const rows=env.window.EgyptPhotoVision.recognize(c.getContext('2d').getImageData(0,0,c.width,c.height),'stocks');
 assert.deepEqual(Object.fromEntries(rows.map(r=>[r.target,r.value])),{'파피루스 두루마리':439,'앙크':495,'예복':360,'황금 가면':3077,deben:786700,'파피루스':270500,'금':521600});
 assert.equal(rows.find(r=>r.target==='황금 가면').needsReview,false);
});
