from PIL import Image
import json
base='Egypt-Culture/tests/fixtures/'
a=Image.open(base+'egypt-buildings.jpeg').convert('RGB'); b=Image.open(base+'egypt-stocks.jpeg').convert('RGB')
def mask(im,box,kind):
 im=im.crop(box); w,h=im.size
 rows=[''.join('1' if (min(p)>(95 if kind=='top' else 180) if kind in ['light','top'] else max(p)<175) else '0' for p in [im.getpixel((x,y)) for x in range(w)]) for y in range(h)]
 return rows
names=[]
for key,box in [('well',(94,134,166,153)),('channel',(226,134,260,153)),('hall',(226,268,260,287)),('press',(94,399,208,419)),('smith',(226,399,291,419)),('smallhome',(94,530,150,550))]:
 names.append(dict(id=key,kind='light',rows=mask(a,box,'light')))
for key,box in [('파피루스 두루마리',(376,162,514,182)),('앙크',(688,162,725,182)),('예복',(1001,162,1037,182)),('황금 가면',(376,244,448,265))]:
 names.append(dict(id=key,kind='dark',rows=mask(b,box,'dark')))
# Separate glyph styles: white levels, brown inventory digits, badge digits.
glyphs=[]
for n,box in [('2',(127,163,139,180)),('3',(127,295,139,313))]: glyphs.append(dict(text=n,kind='light',rows=mask(a,box,'light')))
for n,box in [('4',(377,187,387,207)),('0',(389,187,399,207)),('5',(401,187,412,207)),('3',(689,187,699,207)),('2',(701,187,711,207)),('0',(1001,187,1013,207))]:glyphs.append(dict(text=n,kind='dark',rows=mask(b,box,'dark')))
for n,box in [('3',(202,101,214,123)),('4',(337,102,345,121)),('3',(200,499,208,519)),('0',(210,499,218,519))]:glyphs.append(dict(text=n,kind='badge',rows=mask(a,box,'dark')))
for chars,runs in [('15,180',[(451,456),(460,467),(469,472),(476,481),(485,492),(494,501)]),('94,124',[(559,566),(568,576),(578,581),(584,589),(593,600),(602,610)]),('40,932',[(667,675),(677,684),(686,689),(692,699),(701,708),(711,718)]),('6',[(1235,1242)]),('7',[(1090,1097)])]:
 for ch,(x0,x1) in zip(chars,runs):
  if ch!=',':glyphs.append(dict(text=ch,kind='top',rows=mask(b,(x0,18,x1,37),'top')))
icons=[]
for key,box in [('deben',(412,10,437,43)),('파피루스',(517,12,550,40)),('금',(625,10,652,42))]:
 x0,y0,x1,y1=box
 icons.append(dict(id=key,w=x1-x0,h=y1-y0,points=[[x,y,*b.getpixel((x0+x,y0+y))] for y in range(0,y1-y0,4) for x in range(0,x1-x0,4)]))
data=dict(referenceHeight=709,names=names,glyphs=glyphs,icons=icons,levelLabels=[dict(id='__level',kind='light',rows=mask(a,(94,163,124,181),'light'))])
open('Egypt-Culture/photo-patterns.js','w').write('/* Glyph samples from the two user-provided Egypt screenshots; values are read independently. */\nwindow.EgyptPhotoPatterns='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
