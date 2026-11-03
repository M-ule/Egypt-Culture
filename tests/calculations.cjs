// Run: node --test tests/calculations.cjs
// Exercises the actual inline functions, including the final runtime overrides.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const html = readFileSync(process.env.EGYPT_TEST_HTML || join(__dirname, '..', 'index.html'), 'utf8');
function between(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing source boundary: ${start}`);
  return html.slice(a, b);
}
const runtime = [
  between('const RAW=', 'function stepper('),
  between('function sleepRecipe(', 'function adjustmentRow('),
  between('const CITY_VARIANTS=', '\nfunction fmtPenny('),
  between('const CITY_MAP=', '\nconst legacyNormalize='),
  between('function configs(', '\nfunction duration('),
  between('function cityGroups(', '\nfunction number('),
  between('resourceRequiredHours=function(', '\nfunction decorateNumbers('),
].join('\n');
const load = () => new Function(runtime + `
 return {get state(){return app},reset(){app=clone(DEFAULTS);app.city=cityDefault()},
 resourceRequiredHours,resourceOutput,resourceBenchmarkRate,constructionRowCost,cityStats,
 productOrder,resourceOrder,productOutput,productTargetNeed,resourceTargetNeed,
 productAdjustment,resourceAdjustment,wonderTime,sleepResourcePower,configs,configHours,
 infoProduct,infoResource,happyCycleOutput,productBenchmarkRate,productLevels,modesForProduct,
 availableQuantity,requiredQuantity,displayedRawConsumption,resourceQuantityView,sleepQuantityView,cityQuantityView,fmtPower,fmtBldg,fmtHours,
 cyclicOutput,CITY_VARIANTS,normalizeCity,cityGroups,maxReachResourceLevel,targetRawRequirementTo,WONDER};`)();
function near(actual, expected) { assert(Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`); }

test('resource completion uses integer demands beyond planned stops and zero hours', () => {
 const a=load();a.reset();const n='파피루스',rate=a.resourceBenchmarkRate(n),unit=Math.floor(rate);
 a.state.settings.baseH=10;
 a.state.resourceDetails[n]={enabled:true,rows:[{lv:6,count:1,irrigation:100,hours:1},{lv:6,count:1,irrigation:100,hours:10}]};
 near(a.resourceRequiredHours(n,unit*10),unit*10/(2*rate));
 near(a.resourceRequiredHours(n,unit*12),unit*12/(2*rate));
 near(a.resourceOutput(n),rate*11);
 a.state.resources[n].stock=unit*3;
 near(a.resourceRequiredHours(n,unit*10),unit*7/(2*rate));
 assert.equal(a.resourceRequiredHours(n,unit*2),0);
 a.state.resourceDetails[n].rows.forEach(r=>r.hours=0);
 near(a.resourceRequiredHours(n,unit*10),unit*7/(2*rate));assert.equal(a.resourceOutput(n),0);
 a.state.resourceDetails[n].enabled=false;
 Object.assign(a.state.resources[n],{lv:6,bldgs:2,hours:1,stock:0});
 near(a.resourceRequiredHours(n,unit*3),unit*3/(2*rate));
 a.state.resources[n].bldgs=0;assert.equal(a.resourceRequiredHours(n,unit),null);
});

// Costs checked 2026-10-29 at https://forgeofgames.com/buildings/{culture}/{slug}
// culture: Egypt and AncientEgyptEvent. Values are each destination level's cost.
const upgrades = [
 ['Home_Small','SmallHome','deben',[150,15000,50000,85000,145000]],
 ['Home_Average','AverageHome','deben',[260,50000,85000,140000,240000]],
 ['Home_Premium','PremiumHome','premium',[60,60,60,60,60]],
 ['Irrigation_Oasis','Oasis','premium',[90,90,90,90,90]],
 ['Irrigation_WaterPump','WaterPump','deben',[195,29000,48000,82000,140000]],
 ['Irrigation_Channel','Channel','deben',[345,52000,87000,150000,260000]],
 ['Irrigation_SmallWell','SmallWell','deben',[300,45000,75000,130000,220000]],
 ['Irrigation_IrrigationStation','IrrigationStation','deben',[450,68000,110000,190000,320000]],
 ['Irrigation_Fountain','Fountain','premium',[130,130,130,130,130]],
 ['PapyrusField_Average','AveragePapyrusField','deben',[300,60000,100000,170000,290000]],
 ['GoldMine_Average','AverageGoldMine','deben',[300,60000,100000,170000,290000]],
 ['PapyrusField_Premium','PremiumPapyrusField','premium',[30,30,30,30,30]],
 ['GoldMine_Premium','PremiumGoldMine','premium',[30,30,30,30,30]],
 ['Workshop_PapyrusPress','PapyrusPress','deben',[750,150000,250000,430000,730000]],
 ['Workshop_Goldsmith','Goldsmith','deben',[750,150000,250000,430000,730000]],
];

test('all selectable upgrades, cumulative ranges, fractional counts and budget currency', () => {
  const a = load();a.reset();
  for (const wonder of ['아부심벨','호루스의 신전']) {
    a.state.settings.wonder = wonder;
    for (const [id,,currency,values] of upgrades) {
      for (let cur = 1; cur <= 6; cur++) for (let tgt = cur; tgt <= 6; tgt++) {
        const row = {id,cur,tgt,count:2.5};
        const cost = a.constructionRowCost(row);
        near(cost[currency] || 0, values.slice(cur-1,tgt-1).reduce((s,v) => s+v,0)*2.5);
      }
    }
    a.state.settings.baseH = 0;
    a.state.city.debenStock = 1000000;
    a.state.city.construction = [{id:'Home_Small',cur:1,tgt:6,count:1}, {id:'Home_Premium',cur:1,tgt:6,count:2}];
    const budget = a.cityStats();
    assert.equal(budget.build.deben, 295150);
    assert.equal(budget.build.premium, 600);
    assert.equal(budget.required, 295150);
    assert.equal(budget.remaining, 704850);
    for (const b of Object.values(a.CITY_VARIANTS).flatMap(v => v.buildings).filter(b => b.id !== 'City_CityHall'))
      for (const l of Object.values(b.levels)) assert(Object.keys(l.costs).length > 0, `${b.id} missing costs`);
  }
});

test('random mixed resource completion extends every configured building beyond its operating window', () => {
 const a=load();let seed=20261103;
 const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<1200;i++){
  a.reset();a.state.settings.wonder=['아부심벨','쿠푸왕의 피라미드','대스핑크스','호루스의 신전'][i%4];a.state.settings.wLv=i%51;
  const n=a.resourceOrder[i%2];
  const rows=Array.from({length:1+i%6},()=>({lv:1+Math.floor(random()*6),count:random()*4,irrigation:random()*100,hours:random()<.2?0:random()*24}));
  a.state.resourceDetails[n]={enabled:true,rows};
  const stock=Math.floor(random()*100000);a.state.resources[n].stock=stock;
  const total=a.resourceOutput(n),need=Math.ceil(stock+total*(i%3===0?1.2:random()));
  const actual=a.resourceRequiredHours(n,need);
  if(need<=stock){assert.equal(actual,0);continue;}
  const baseRate=(p,h)=>p.out0/(p.min/60)+Math.floor(p.maxH*h/100*p.factor+1e-10);
  const multiplier=a.resourceBenchmarkRate(n)/baseRate(a.infoResource(n,6),100);
  const output=h=>stock+rows.reduce((sum,r)=>sum+baseRate(a.infoResource(n,r.lv),r.irrigation)*r.count*multiplier*h,0);
  let lo=0,hi=1;while(output(hi)<need)hi*=2;
  for(let k=0;k<64;k++){const mid=(lo+hi)/2;if(output(mid)>=need)hi=mid;else lo=mid;}
  near(actual,hi);near(a.resourceOutput(n),total);
 }
});

test('wonder completion is independent of all operating time inputs and respects completed product cycles', () => {
 const a=load();a.reset();const n='파피루스 두루마리';
 a.state.wonder.cur=0;a.state.wonder.tgt=3;a.state.settings.baseH=0;
 a.state.products[n].stock=0;
 a.state.details[n]={enabled:true,rows:[{lv:2,count:0.5,irrigation:100,hours:0,mode:'30분'},{lv:3,count:1,irrigation:100,hours:0,mode:'1시간'}]};
 const need=a.productTargetNeed(n),out=h=>a.state.details[n].rows.reduce((sum,r)=>{const p=a.infoProduct(n,r.lv,r.mode);return sum+Math.floor(h*60/p.min+1e-10)*a.happyCycleOutput(p,r.irrigation)*r.count;},0);
 let minutes=0;while(out(minutes/60)<need)minutes++;
 near(a.wonderTime(n),minutes/60);
 assert.equal(a.productOutput(n),0);
 a.state.settings.baseH=100;a.state.details[n].rows[0].hours=0.1;a.state.details[n].rows[1].hours=100;
 near(a.wonderTime(n),minutes/60);
 a.state.products[n].stock=need;assert.equal(a.wonderTime(n),0);
 a.state.products[n].stock=0;a.state.details[n].rows.forEach(r=>r.count=0);assert.equal(a.wonderTime(n),null);
});

test('photo level groups survive reload and drive city totals', () => {
 const a=load();a.reset();a.state.city=a.normalizeCity({...a.state.city,manual:{Irrigation_Channel:5,Workshop_PapyrusPress:1,City_CityHall:1},photoGroups:{Irrigation_Channel:[{lv:2,count:4},{lv:3,count:1}],Workshop_PapyrusPress:[{lv:3,count:1}],City_CityHall:[{lv:2,count:1}]}});
 const channel=a.CITY_VARIANTS.Egypt.buildings.find(b=>b.id==='Irrigation_Channel');
 assert.deepEqual(a.cityGroups(channel).map(g=>g.n),[4,1]);assert.strictEqual(a.cityGroups(channel)[1].l,channel.levels[3]);
 assert.doesNotThrow(()=>a.cityStats());
 const restored=a.normalizeCity(JSON.parse(JSON.stringify(a.state.city)));assert.deepEqual(restored.photoGroups.Irrigation_Channel,[{lv:2,count:4},{lv:3,count:1}]);
});


test('maximum reachable level respects both resources, owned goods and exact cumulative boundaries', () => {
  const a=load();a.reset();
  assert.equal(a.maxReachResourceLevel(),1);
  a.state.wonder.cur=0;
  assert.equal(a.maxReachResourceLevel(),0);
  a.state.wonder.cur=1;
  a.state.settings.productRawCycle='30분';
  // Independent requirements: sum each level, deduct each owned good once,
  // then convert only that shortage with its Lv6 recipe.
  const cost=(raw,target)=>a.productOrder.reduce((sum,n)=>{
    let need=0;for(let lv=a.state.wonder.cur+1;lv<=target;lv++)need+=a.WONDER[lv]?.[n]||0;
    const p=a.infoProduct(n,6,'30분');
    return sum+(p.raw===raw?Math.max(0,need-a.state.products[n].stock)*p.rawUse/a.happyCycleOutput(p,100):0);
  },0);
  for(const target of [2,7,20,49,50]){
    for(const raw of a.resourceOrder)a.state.resources[raw].stock=cost(raw,target);
    assert.equal(a.maxReachResourceLevel(),target);
    for(const raw of a.resourceOrder){
      const exact=a.state.resources[raw].stock;
      a.state.resources[raw].stock=exact-0.001;
      assert(a.maxReachResourceLevel()<target,raw+' shortfall must limit level');
      a.state.resources[raw].stock=exact;
    }
  }
  for(const n of a.productOrder)a.state.products[n].stock=1e12;
  for(const raw of a.resourceOrder)a.state.resources[raw].stock=0;
  assert.equal(a.maxReachResourceLevel(),50);
  a.state.wonder.cur=50;
  assert.equal(a.maxReachResourceLevel(),50);
});

test('reach adds actual resource schedules and bonuses without double counting planned goods', () => {
  const a=load();a.reset();a.state.settings.baseH=10;
  a.state.settings.productRawCycle='30분';
  for(const raw of a.resourceOrder){
    a.state.resourceDetails[raw]={enabled:true,rows:[{lv:6,count:2,irrigation:51,hours:1},{lv:3,count:0.5,irrigation:100,hours:7}]};
  }
  for(const wonder of ['아부심벨','쿠푸왕의 피라미드','대스핑크스','호루스의 신전']){
    a.state.settings.wonder=wonder;a.state.settings.wLv=30;
    const expected=a.maxReachResourceLevel();
    const production=Object.fromEntries(a.resourceOrder.map(n=>[n,a.resourceOutput(n)]));
    for(const n of a.resourceOrder){a.state.resourceDetails[n].enabled=false;a.state.resources[n].bldgs=0;a.state.resources[n].stock=production[n];}
    assert.equal(a.maxReachResourceLevel(),expected);
    for(const n of a.resourceOrder){a.state.resourceDetails[n].enabled=true;a.state.resources[n].stock=0;}
  }
  const baseline=a.maxReachResourceLevel();
  for(const n of a.productOrder)Object.assign(a.state.products[n],{lv:6,bldgs:1e6,hours:1000});
  assert.equal(a.maxReachResourceLevel(),baseline,'excess product plans neither spend nor create raw budget');
  a.state.wonder.tgt=50;
  assert.equal(a.maxReachResourceLevel(),baseline,'selected goal does not change maximum');
  a.state.wonder.tgt=1;
  assert.equal(a.maxReachResourceLevel(),baseline);
});

test('reach follows reference cycle including mixed per-product cycle inheritance', () => {
  const a=load();a.reset();
  a.state.settings.productRawCycle='생산 계산기값';
  for(const n of a.productOrder)a.state.products[n].mode='30분';
  a.state.products['예복'].mode='2시간';
  const raw='파피루스',target=10;
  const expected=a.productOrder.reduce((sum,n)=>{
    const p=a.infoProduct(n,6,a.state.products[n].mode);
    let need=0;for(let lv=2;lv<=target;lv++)need+=a.WONDER[lv]?.[n]||0;
    return sum+(p.raw===raw?need*p.rawUse/a.happyCycleOutput(p,100):0);
  },0);
  near(a.targetRawRequirementTo(raw,target),expected);
  a.state.settings.productRawCycle='2시간';
  assert(a.targetRawRequirementTo(raw,target)<expected);
  for(const raw of a.resourceOrder)a.state.resources[raw].stock=a.targetRawRequirementTo(raw,target);
  assert.equal(a.maxReachResourceLevel(),target);
  a.state.settings.productRawCycle='생산 계산기값';
  assert(a.maxReachResourceLevel()<target);
});


test('displayed inventory reconciles fractional production and conservative per-product consumption', () => {
  const a=load();a.reset();
  a.state.settings.baseH=1/60;
  Object.assign(a.state.resources['파피루스'],{lv:1,bldgs:1,irrigation:100,stock:100});
  Object.assign(a.state.products['파피루스 두루마리'],{lv:1,bldgs:0.13,irrigation:100,mode:'1분'});
  near(a.resourceOutput('파피루스'),30.7475);
  assert.equal(a.availableQuantity(a.resourceOutput('파피루스')),30);
  near(a.productOutput('파피루스 두루마리'),0.91);
  assert.equal(a.availableQuantity(a.productOutput('파피루스 두루마리')),0);
  assert.equal(a.displayedRawConsumption('파피루스'),8);
  assert.deepEqual(a.sleepQuantityView('파피루스'),{need:24,projected:122,remain:98});
  // Quantity presentation must not round the underlying production functions.
  near(a.resourceOutput('파피루스'),30.7475);
  assert.equal(a.availableQuantity(31-1e-12),31);
  assert.equal(a.requiredQuantity(31+1e-12),31);
  assert.equal(a.availableQuantity(-0.2),-1);
  assert.equal(a.availableQuantity(null),null);
  assert.equal(a.requiredQuantity(Infinity),null);
  assert.equal(a.fmtPower(12.34),'12.3');
  assert.equal(a.fmtBldg(0.13),'0.13');
  assert.equal(a.fmtHours(0.25),'0.25');
});

test('displayed city budget uses rounded line items without changing financial calculation precision', () => {
  const a=load();a.reset();a.state.settings.baseH=1;
  Object.assign(a.state.city,{debenStock:10,debenRate:100.1,debenHours:1});
  Object.assign(a.state.products['파피루스 두루마리'],{lv:1,bldgs:0.13,irrigation:100,mode:'1분'});
  const raw=a.cityStats(),shown=a.cityQuantityView(raw);
  near(raw.production,100.1);near(raw.consumption,15.6);
  assert.equal(shown.production,100);assert.equal(shown.consumption,16);
  assert.equal(shown.secured,110);assert.equal(shown.required,16);assert.equal(shown.remaining,94);
  a.state.city.construction=[{id:'Home_Small',cur:0,tgt:1,count:0.13}];
  const budget=a.cityQuantityView(a.cityStats());
  assert(Number.isInteger(budget.build.deben));
  assert.equal(budget.remaining,budget.secured-budget.required);
  assert.equal(budget.required,budget.consumption+(budget.build.deben||0)+(budget.research.deben||0));
});


test('rounded shortage and completion agree at the 30.6 versus 31 unit boundary', () => {
 const a=load();a.reset();a.state.settings.baseH=1/60;
 Object.assign(a.state.resources['파피루스'],{lv:1,bldgs:1,irrigation:100});
 Object.assign(a.state.products['파피루스 두루마리'],{lv:1,bldgs:0.51,irrigation:100,mode:'1분'});
 assert.deepEqual(a.resourceQuantityView('파피루스'),{production:30,need:31,remain:-1});
 const h=a.resourceRequiredHours('파피루스',30.6);
 assert(h>1/60);assert.equal(Math.ceil(h*60),2);
 near(a.resourceOutput('파피루스'),30.7475);
 // The whole target is complete at h, with the immediately preceding minute still short.
 const rate=a.resourceOutput('파피루스')*60;
 near(h*rate,31);
 a.state.resources['파피루스'].stock=1;
 assert.equal(a.resourceQuantityView('파피루스').remain,0);
 assert.equal(Math.ceil(a.resourceRequiredHours('파피루스',30.6)*60),1);
});
